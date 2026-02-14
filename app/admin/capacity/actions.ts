'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDayDetails(date: string) {
    const supabase = await createClient()

    // 1. Fetch capacity config for this day
    const { data: capacity } = await supabase
        .from('daily_availability')
        .select('*')
        .eq('date', date)
        .single()

    // 2. Fetch approved requests that include this date
    const { data: requests } = await supabase
        .from('requests')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .lte('start_date', date)
        .gte('end_date', date)
        .neq('status', 'cancelled') // Hide cancelled requests
        .order('created_at', { ascending: false }) // Order by newest

    console.log(`getDayDetails for ${date}: Found ${requests?.length} requests (excluding cancelled).`)


    // 3. Fetch special events ? (Optional, but good for context)
    const { data: events } = await supabase
        .from('special_events')
        .select(`
             *,
            profiles (
                full_name
            )
        `)
        .eq('date', date)

    return {
        capacity,
        requests: requests || [],
        events: events || []
    }
}

export async function revokeRequest(requestId: string, path: string) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get request dates first
    const { data: req } = await supabase.from('requests').select('start_date, end_date').eq('id', requestId).single()
    if (!req) throw new Error('Request not found')

    // 2. Update status to cancelled
    const { error: updateError } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

    if (updateError) {
        console.error("Error updating status to cancelled:", updateError)
        throw new Error(updateError.message)
    }

    // 3. Regenerate availability for the affected range to ensure accuracy
    // This fixes any "0/8" sync issues automatically.
    // We import dynamically to avoid circular deps if any (though here it's fine)
    const { regenerateDailyAvailability } = await import('@/app/admin/settings/capacity-actions')
    await regenerateDailyAvailability(req.start_date, req.end_date)

    console.log(`Request ${requestId} cancelled and capacity regenerated.`)

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
}
