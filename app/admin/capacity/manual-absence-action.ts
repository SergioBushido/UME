'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// No, existing logic might be tied to specific user flow.
// Actually, `approve_request_with_capacity` is a client-wrapper for the RPC.
// I can just insert a request as 'approved' directly IF I ensure capacity logic is respected OR I force it.
// The user is Admin, they might want to force override? 
// For now, let's respect capacity, OR simpler: Insert as 'pending' then 'approve' via the same RPC.

export async function createManualAbsence(formData: FormData) {
    const supabase = await createClient()

    const userId = formData.get('userId') as string
    const type = formData.get('type') as string
    const date = formData.get('date') as string

    if (!userId || !type || !date) throw new Error("Missing fields")

    // Prevent overlapping requests for this user on the same dates
    const start = date
    const end = date
    const { data: overlapping } = await supabase
        .from('requests')
        .select('id,type,start_date,end_date,status')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .lte('start_date', end)
        .gte('end_date', start)

    if (overlapping && overlapping.length > 0) {
        throw new Error('El usuario ya tiene una ausencia en esa fecha.')
    }

    // 1. Create request as pending
    const { data: request, error } = await supabase
        .from('requests')
        .insert({
            user_id: userId,
            type: type,
            start_date: date,
            end_date: date,
            reason: 'Manual entry by Admin',
            status: 'pending'
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
}

export async function createAndApproveAbsence(userId: string, type: 'PO' | 'DA' | 'AP', startDate: string, endDate: string) {
    const supabase = await createClient()

    // Prevent overlapping requests for this user
    const { data: overlapping } = await supabase
        .from('requests')
        .select('id,type,start_date,end_date,status')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .lte('start_date', endDate)
        .gte('end_date', startDate)

    if (overlapping && overlapping.length > 0) {
        throw new Error('El usuario ya tiene una ausencia solapada en ese rango de fechas.')
    }

    // 1. Insert Request
    const { data: request, error } = await supabase
        .from('requests')
        .insert({
            user_id: userId,
            type: type,
            start_date: startDate,
            end_date: endDate,
            reason: 'Manual entry by Admin',
            status: 'pending'
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // 2. Approve
    const { error: rpcError } = await supabase.rpc('approve_request_with_capacity', {
        request_id: request.id
    })

    if (rpcError) {
        // Rollback? Delete request if failed?
        await supabase.from('requests').delete().eq('id', request.id)
        throw new Error(rpcError.message)
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
}

export async function getUsers() {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    return data || []
}

export async function updateAbsence(requestId: string, data: { userId: string, type: 'PO' | 'DA' | 'AP', startDate: string, endDate: string }) {
    const supabase = await createClient()

    // 1. Get OLD request details to know what range to regenerate
    const { data: oldReq } = await supabase.from('requests').select('start_date, end_date, status').eq('id', requestId).single()

    // 1.5 Revert capacity/balance if it was previously approved
    if (oldReq?.status === 'approved') {
        const { error: revertError } = await supabase.rpc('revert_capacity_for_request', { request_id: requestId })
        if (revertError) {
            logger.error('Error reverting previous capacity:', revertError)
            throw new Error('Error al revertir la capacidad anterior: ' + revertError.message)
        }
    }

    // Prevent overlapping (other) requests for this user in the NEW range
    const { data: overlapping } = await supabase
        .from('requests')
        .select('id,type,start_date,end_date,status')
        .eq('user_id', data.userId)
        .neq('status', 'cancelled')
        .lte('start_date', data.endDate)
        .gte('end_date', data.startDate)

    // If overlapping exists other than the current request, block
    if (overlapping?.some((r: any) => r.id !== requestId)) {
        throw new Error('Existe otra ausencia solapada para este usuario en las nuevas fechas.')
    }

    // 2. Update the request details (set to pending)
    // This effectively "removes" it from the approved count once we regenerate
    const { error: updateError } = await supabase
        .from('requests')
        .update({
            user_id: data.userId,
            type: data.type,
            start_date: data.startDate,
            end_date: data.endDate,
            status: 'pending'
        })
        .eq('id', requestId)

    if (updateError) throw new Error('Error updating request: ' + updateError.message)

    // 3. Regenerate availability for OLD range AND NEW range
    // This ensures the valid capacity is prepared for the new approval
    const { regenerateDailyAvailability } = await import('@/app/admin/settings/capacity-actions')

    // Efficiently regenerate. If ranges overlap, we could merge, but calling twice is safe.
    if (oldReq) {
        await regenerateDailyAvailability(new Date(oldReq.start_date), new Date(oldReq.end_date))
    }
    await regenerateDailyAvailability(new Date(data.startDate), new Date(data.endDate))

    // 4. Approve again (checks capacity for new details)
    const { error: approveError } = await supabase.rpc('approve_request_with_capacity', { request_id: requestId })

    if (approveError) {
        throw new Error('Solicitud actualizada a PENDIENTE. No se pudo aprobar automáticamente (posible falta de cupo): ' + approveError.message)
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
}
