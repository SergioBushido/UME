'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSpecialEvent(formData: FormData) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: adminFile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminFile?.role !== 'admin') throw new Error('No autorizado')

    const type = formData.get('type')
    const user_id = formData.get('user_id')
    const date = formData.get('date')
    const description = formData.get('description')

    const { error } = await supabase
        .from('special_events')
        .insert({
            type,
            user_id,
            date,
            description
        })

    if (error) {
        throw new Error('Error al crear evento')
    }

    revalidatePath('/admin/calendar')
    revalidatePath('/user/calendar')
}
