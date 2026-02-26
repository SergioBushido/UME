'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
        const adminSupabase = createAdminClient()
        const { error } = await adminSupabase.rpc('revert_capacity_for_request', { request_id: requestId })
        if (error) throw new Error(error.message)
    }

    // Update status to cancelled
    const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

    if (error) throw new Error(error.message)

    revalidatePath('/user/requests')
    revalidatePath('/user/dashboard')
    revalidatePath('/admin/requests')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
    revalidatePath('/admin/calendar')
}

export async function updateUserRequest(requestId: string, data: { type: 'PO' | 'DA' | 'AP', startDate: string, endDate: string }) {
    const supabase = await createClient()

    // 1. Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // 2. Verify ownership and current status
    const { data: request, error: fetchError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !request) throw new Error('Solicitud no encontrada')
    if (request.user_id !== user.id) throw new Error('No autorizado para editar esta solicitud')

    // 3. If it was approved, we MUST revert capacity/balance first because it's going back to pending
    if (request.status === 'approved') {
        const adminSupabase = createAdminClient()
        const { error: revertError } = await adminSupabase.rpc('revert_capacity_for_request', { request_id: requestId })
        if (revertError) throw new Error('Error al revertir capacidad: ' + revertError.message)
    }

    // 4. Update the request and reset status to pending
    const { error: updateError } = await supabase
        .from('requests')
        .update({
            type: data.type,
            start_date: data.startDate,
            end_date: data.endDate,
            status: 'pending',
            rejection_reason: null // Clear any previous rejection reason
        })
        .eq('id', requestId)

    if (updateError) throw new Error('Error al actualizar la solicitud: ' + updateError.message)

    revalidatePath('/user/requests')
    revalidatePath('/user/dashboard')
    revalidatePath('/admin/requests')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
    revalidatePath('/admin/calendar')
}
