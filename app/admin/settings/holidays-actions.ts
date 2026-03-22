'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { regenerateDailyAvailability } from './capacity-actions'

export async function addHoliday(date: string, description: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('holidays').insert({ date, description })
    if (error) throw new Error(error.message)
    
    // Regenerate availability for the year to ensure frontend respects it
    // if there are any caching mechanisms, though holidays are mainly checked in actions.
    const start = new Date(new Date(date).getFullYear(), 0, 1)
    const end = new Date(new Date(date).getFullYear(), 11, 31)
    await regenerateDailyAvailability(start, end)
    
    revalidatePath('/admin/settings')
    return { success: true }
}

export async function deleteHoliday(date: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('holidays').delete().eq('date', date)
    if (error) throw new Error(error.message)
        
    const start = new Date(new Date(date).getFullYear(), 0, 1)
    const end = new Date(new Date(date).getFullYear(), 11, 31)
    await regenerateDailyAvailability(start, end)

    revalidatePath('/admin/settings')
    return { success: true }
}
