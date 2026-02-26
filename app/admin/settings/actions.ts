'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Debug logging and perform writes with admin client to bypass RLS
    try {
        console.log('updateSettings:', { key, value })

        const adminSupabase = createAdminClient()

        // Check if exists (using admin client)
        const { data: existing, error: selectError } = await adminSupabase.from('system_settings').select('*').eq('key', key).maybeSingle()
        if (selectError) throw selectError

        if (existing) {
            const { error: updateError } = await adminSupabase.from('system_settings').update({ value }).eq('key', key)
            if (updateError) throw updateError
        } else {
            const { error: insertError } = await adminSupabase.from('system_settings').insert({ key, value })
            if (insertError) throw insertError
        }
    } catch (e: any) {
        console.error('Error updating settings:', e?.message || e)
        throw new Error('Error al guardar configuración: ' + (e?.message || String(e)))
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
    return { success: true }
}
