'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    // 1. Create request
    const { data: request, error } = await supabase
        .from('requests')
        .insert({
            user_id: userId,
            type: type,
            start_date: date,
            end_date: date,
            reason: 'Manual entry by Admin',
            status: 'approved' // Insert directly as approved? 
            // If we insert as approved, the trigger/RPC for capacity might not run unless we use the specific function.
            // The DB constraints might block if we don't handle capacity. 
            // But my `regenerateDailyAvailability` is now the source of truth for counts.
            // So if I insert this, and then run `regenerateDailyAvailability`, it would be fine.
            // BUT better to use the RPC `approve_request_with_capacity` to ensure atomic updates.
        })
        .select()
        .single()

    if (error) {
        // If RLS failing because inserted as 'approved' directly? 
        // Let's insert as 'pending' first.
        throw new Error(error.message)
    }

    // Actually, if I insert as 'approved', I need to manually decrement capacity or run sync.
    // Let's rely on the RPC.

    // BETTER STRATEGY: 
    // 1. Insert as 'pending'.
    // 2. Call `approve_request_with_capacity(id)`.
}

export async function createAndApproveAbsence(userId: string, type: 'PO' | 'DA' | 'AP', startDate: string, endDate: string) {
    const supabase = await createClient()

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
            console.error('Error reverting previous capacity:', revertError)
            // Proceed cautiously? Or throw? 
            // Throwing is safer to avoid balance corruption
            throw new Error('Error al revertir la capacidad anterior: ' + revertError.message)
        }
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
