'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelRequest(requestId: string) {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Verify ownership
    const { data: request } = await supabase.from('requests').select('*').eq('id', requestId).single()
    if (!request) throw new Error('Solicitud no encontrada')
    if (request.user_id !== user.id) throw new Error('No autorizado')

    // If already cancelled or rejected, do nothing?
    if (request.status === 'cancelled' || request.status === 'rejected') {
        throw new Error('La solicitud ya está finalizada')
    }

    // Revert capacity if approved
    if (request.status === 'approved') {
        const { error } = await supabase.rpc('revert_capacity_for_request', { request_id: requestId })
        if (error) throw new Error(error.message)
    }

    // Update status to cancelled
    const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

    if (error) throw new Error(error.message)

    revalidatePath('/user/requests')
}
