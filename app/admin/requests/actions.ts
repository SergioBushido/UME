'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected', reason?: string) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') {
        throw new Error('No autorizado')
    }

    // Use admin client to bypass RLS for RPC if needed, or just standard client since we granted permissions
    // But since the RPC is SECURITY DEFINER, standard client works if authenticated.

    if (status === 'approved') {
        const { error } = await supabase.rpc('approve_request_with_capacity', { request_id: requestId })
        if (error) {
            console.error('RPC Error:', error)
            throw new Error(error.message)
        }
    } else if (status === 'rejected') {
        // 1. Revert capacity (logic inside checks if it was approved)
        const { error: revertError } = await supabase.rpc('revert_capacity_for_request', { request_id: requestId })
        if (revertError) {
            console.error('Revert RPC Error:', revertError)
            throw new Error(revertError.message)
        }

        // 2. Update status
        // We can use adminSupabase for this simple update or standard supabase if RLS allows
        // Admin RLS allows check.
        const { error } = await supabase
            .from('requests')
            .update({
                status,
                rejection_reason: reason || null
            })
            .eq('id', requestId)

        if (error) throw new Error(error.message)
    }

    revalidatePath('/admin/requests')
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
}
