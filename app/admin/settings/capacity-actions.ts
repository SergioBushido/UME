'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eachDayOfInterval, format, parseISO, startOfDay } from 'date-fns'

export type StaffLevel = {
    id?: string
    start_date: string
    end_date?: string | null
    total_staff: number
}

export type PresenceRule = {
    id?: string
    start_date: string
    end_date?: string | null
    min_presence_percent: number
    description?: string
}

export async function getCapacityConfig() {
    const supabase = await createClient()

    const { data: staffLevels } = await supabase
        .from('staff_levels')
        .select('*')
        .order('start_date', { ascending: true })

    const { data: presenceRules } = await supabase
        .from('presence_rules')
        .select('*')
        .order('start_date', { ascending: true })

    return { staffLevels, presenceRules }
}

export async function getDailyAvailability(start: string, end: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('daily_availability')
        .select('*')
        .gte('date', start)
        .lte('date', end)

    return data as {
        date: string
        total_staff: number
        min_required: number
        max_absence: number
        approved_count: number
        is_locked: boolean
    }[] | null
}

export async function upsertStaffLevel(level: StaffLevel) {
    const supabase = await createClient()

    // Validate role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Basic validation
    if (level.end_date && new Date(level.end_date) < new Date(level.start_date)) {
        throw new Error('End date must be after start date')
    }

    const { error } = await supabase
        .from('staff_levels')
        .upsert({
            id: level.id,
            start_date: level.start_date,
            end_date: level.end_date || null,
            total_staff: level.total_staff
        })

    if (error) throw new Error(error.message)

    // Trigger regeneration for the affected period + 1 year or logical range
    // For now, let's regenerate for the specific period modified, or a default range if indefinite
    const start = new Date(level.start_date)
    const end = level.end_date ? new Date(level.end_date) : new Date(new Date().getFullYear() + 1, 11, 31) // Up to next year end

    await regenerateDailyAvailability(start, end)
    revalidatePath('/admin/settings')
}

export async function deleteStaffLevel(id: string) {
    const supabase = await createClient()
    await supabase.from('staff_levels').delete().eq('id', id)
    revalidatePath('/admin/settings')
}

export async function upsertPresenceRule(rule: PresenceRule) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('presence_rules')
        .upsert({
            id: rule.id,
            start_date: rule.start_date,
            end_date: rule.end_date || null,
            min_presence_percent: rule.min_presence_percent,
            description: rule.description
        })

    if (error) throw new Error(error.message)

    const start = new Date(rule.start_date)
    const end = rule.end_date ? new Date(rule.end_date) : new Date(new Date().getFullYear() + 1, 11, 31)

    await regenerateDailyAvailability(start, end)
    revalidatePath('/admin/settings')
}

export async function deletePresenceRule(id: string) {
    const supabase = await createClient()
    await supabase.from('presence_rules').delete().eq('id', id)
    revalidatePath('/admin/settings')
}

export async function regenerateDailyAvailability(start: Date, end: Date) {
    const supabase = await createClient()

    // 1. Fetch all levels and rules that might overlap
    // We fetch ALL for simplicity in this MVP, then filter in memory (better for complex date ranges in SQL)
    // In production with thousands of rules, use DB range queries.
    const { data: staffLevels } = await supabase.from('staff_levels').select('*')
    const { data: presenceRules } = await supabase.from('presence_rules').select('*')

    // 2. Iterate days
    const days = eachDayOfInterval({ start, end })

    // 2.1 Fetch all approved requests in this range to calculate approved_count accurately
    const { data: approvedRequests } = await supabase
        .from('requests')
        .select('start_date, end_date')
        .eq('status', 'approved')
        .lte('start_date', format(end, 'yyyy-MM-dd'))
        .gte('end_date', format(start, 'yyyy-MM-dd'))

    const updates = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')

        // Calculate approved count from requests
        // Compare using strings to avoid timezone issues (UTC vs Local)
        const approved_count = approvedRequests?.filter(r => {
            return dateStr >= r.start_date && dateStr <= r.end_date
        }).length || 0

        // Find applicable staff level
        const level = staffLevels?.find(l => {
            const lEnd = l.end_date || '9999-12-31'
            return dateStr >= l.start_date && dateStr <= lEnd
        })

        // Find applicable rule
        const rule = presenceRules?.find(r => {
            const rEnd = r.end_date || '9999-12-31'
            return dateStr >= r.start_date && dateStr <= rEnd
        })

        const total_staff = level?.total_staff || 0
        const min_percent = rule?.min_presence_percent ?? 0

        const min_required = Math.ceil((total_staff * min_percent) / 100)
        const max_absence = Math.max(0, total_staff - min_required)

        return {
            date: dateStr,
            total_staff,
            min_required,
            max_absence,
            approved_count // Sync with actual requests
        }
    })

    // 3. Upsert
    if (updates.length > 0) {
        const { error } = await supabase
            .from('daily_availability')
            .upsert(updates, {
                onConflict: 'date',
                ignoreDuplicates: false
            })

        if (error) console.error('Error generating availability:', error)
    }
}
