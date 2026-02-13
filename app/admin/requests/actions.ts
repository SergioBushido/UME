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

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()

    const { data: updatedRequest, error } = await adminSupabase
        .from('requests')
        .update({
            status,
            rejection_reason: reason || null
        })
        .eq('id', requestId)
        .select()

    if (error) {
        console.error('Error updating request:', error)
        throw new Error(`Error al actualizar: ${error.message}`)
    }

    if (!updatedRequest || updatedRequest.length === 0) {
        throw new Error('No se pudo actualizar la solicitud (No encontrada)')
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
