'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') throw new Error('No autorizado')

    const key = formData.get('key') as string
    let value = formData.get('value') as string

    // Parse JSON if blocked_weeks
    if (key === 'blocked_weeks') {
        try {
            // Normalize to ensure valid JSON
            const parsed = JSON.parse(value)
            value = parsed
        } catch (e) {
            throw new Error('Formato JSON inválido')
        }
    } else if (key === 'min_staffing') {
        value = { percent: Number(value) } as any
    }

    // Check if exists
    const { data: existing } = await supabase.from('system_settings').select('*').eq('key', key).single()

    if (existing) {
        await supabase.from('system_settings').update({ value }).eq('key', key)
    } else {
        await supabase.from('system_settings').insert({ key, value })
    }

    // Trigger regeneration if blocked_weeks changed
    if (key === 'blocked_weeks') {
        const { regenerateDailyAvailability } = await import('./capacity-actions')
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 1) // Start of current year
        const end = new Date(now.getFullYear() + 1, 11, 31) // End of next year
        await regenerateDailyAvailability(start, end)
    }

    revalidatePath('/admin/settings')
}
