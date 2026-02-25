'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected', reason?: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') {
        throw new Error('No autorizado')
    }

    if (status === 'approved') {
        const { error } = await supabase.rpc('approve_request_with_capacity', { request_id: requestId })
        if (error) {
            logger.error('RPC Error:', error)
            throw new Error(error.message)
        }
    } else if (status === 'rejected') {
        // 1. Get current request details
        const { data: req, error: fetchError } = await adminSupabase
            .from('requests')
            .select('status, user_id, type, start_date')
            .eq('id', requestId)
            .single()

        if (fetchError || !req) throw new Error('Solicitud no encontrada')

        // 2. ONLY revert capacity if it was previously approved
        if (req.status === 'approved') {
            const { error: revertError } = await adminSupabase.rpc('revert_capacity_for_request', { request_id: requestId })
            if (revertError) {
                logger.error('Revert RPC Error:', revertError)
                throw new Error('Error al revertir capacidad: ' + revertError.message)
            }
        }

        // 3. Update status and reason
        const { error: updateError } = await adminSupabase
            .from('requests')
            .update({
                status: 'rejected',
                rejection_reason: reason || null
            })
            .eq('id', requestId)

        if (updateError) {
            logger.error('Update rejection Error:', updateError)
            throw new Error('Error al actualizar estado: ' + updateError.message)
        }

        // 4. Send internal message notification
        try {
            await adminSupabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: req.user_id,
                content: `Tu solicitud de ${req.type} para el ${new Date(req.start_date).toLocaleDateString()} ha sido RECHAZADA. Motivo: ${reason || 'Sin motivo especificado'}.`,
                is_read: false
            })
        } catch (msgErr) {
            logger.error('Failed to send rejection message:', msgErr)
            // We don't throw here to ensure the status update remains
        }
    }

    revalidatePath('/admin/requests')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
    revalidatePath('/admin/calendar')
    revalidatePath('/user/requests')
    revalidatePath('/user/dashboard')
}

export async function updateRequest(requestId: string, data: { type: 'PO' | 'DA' | 'AP', start_date: string, end_date: string }) {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') {
        throw new Error('No autorizado')
    }

    // Use admin client
    const adminSupabase = createAdminClient()

    // Perform update
    const { error } = await adminSupabase
        .from('requests')
        .update({
            type: data.type,
            start_date: data.start_date,
            end_date: data.end_date
        })
        .eq('id', requestId)

    if (error) throw new Error(`Error updating request: ${error.message}`)

    revalidatePath('/admin/requests')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
    revalidatePath('/admin/calendar')
    revalidatePath('/user/requests')
    revalidatePath('/user/dashboard')
}

export async function deleteRequest(requestId: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 1. Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') throw new Error('No autorizado')

    // 2. Get details
    const { data: req, error: fetchError } = await adminSupabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (fetchError || !req) throw new Error('Solicitud no encontrada')

    // 3. Revert if approved
    if (req.status === 'approved') {
        const { error: revertError } = await adminSupabase.rpc('revert_capacity_for_request', { request_id: requestId })
        if (revertError) throw new Error('Error al revertir capacidad: ' + revertError.message)
    }

    // 4. Delete
    const { error: deleteError } = await adminSupabase
        .from('requests')
        .delete()
        .eq('id', requestId)

    if (deleteError) throw new Error('Error al eliminar: ' + deleteError.message)

    // 5. Regenerate availability
    try {
        const { regenerateDailyAvailability } = await import('@/app/admin/settings/capacity-actions')
        await regenerateDailyAvailability(new Date(req.start_date), new Date(req.end_date))
    } catch (e) {
        console.error('Failed to regenerate availability:', e)
    }

    // 6. Revalidate
    revalidatePath('/admin/requests')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
    revalidatePath('/admin/calendar')
    revalidatePath('/user/requests')
    revalidatePath('/user/dashboard')
}
