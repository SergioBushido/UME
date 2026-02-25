'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRequest(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const type = formData.get('type') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string
    const target_user_id = formData.get('target_user_id') as string
    const auto_approve = formData.get('auto_approve') === 'true'

    if (!type || !start_date || !end_date) {
        throw new Error('Todos los campos son obligatorios')
    }

    // Validate dates
    const start = new Date(start_date)
    const end = new Date(end_date)

    if (start > end) {
        throw new Error('La fecha de fin no puede ser anterior a la de inicio')
    }

    // Check permissions and effective user
    const { data: ownProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = ownProfile?.role === 'admin'
    const effectiveUserId = (isAdmin && target_user_id) ? target_user_id : user.id

    const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', effectiveUserId).single()
    if (!targetProfile) throw new Error('Usuario objetivo no encontrado')

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check capacity
    const { data: availability } = await supabase
        .from('daily_availability')
        .select('*')
        .gte('date', start_date)
        .lte('date', end_date)

    // Simple loop to check each day (ignoring timezone issues for now, assuming date strings match)
    // We can iterate by date string directly since we have start/end.
    // Or just check if we have enough slots.
    // Actually, we need to check EVERY day in the range.

    // Helper to add days (simple version to avoid big imports if desired, but we have date-fns)
    // Let's use date-fns if available, or simple loop
    const current = new Date(start)
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        const daily = availability?.find(a => a.date === dateStr)

        if (!daily) {
            // Fallback: If no config is present, currently blocking.
            // In a real app, might default to "Open". 
            // But strict requirements suggest control.
            throw new Error(`No hay configuración de capacidad para el día ${dateStr}. Contacte al administrador para generar el calendario.`)
        }

        if (daily.is_locked) {
            throw new Error(`El día ${dateStr} está bloqueado.`)
        }

        if ((daily.max_absence - daily.approved_count) <= 0) {
            throw new Error(`No hay cupo disponible para el día ${dateStr}.`)
        }

        current.setDate(current.getDate() + 1)
    }

    // Check balance - Skip for 'DO'
    if (type !== 'DO') {
        if (type === 'PO' && (targetProfile.balance_po || 0) < diffDays) throw new Error(`Saldo insuficiente de PO. Disponibles: ${targetProfile.balance_po}, Solicitados: ${diffDays}`)
        if (type === 'DA' && (targetProfile.balance_da || 0) < diffDays) throw new Error(`Saldo insuficiente de DA. Disponibles: ${targetProfile.balance_da}, Solicitados: ${diffDays}`)
        if (type === 'AP' && (targetProfile.balance_ap || 0) < diffDays) throw new Error(`Saldo insuficiente de AP. Disponibles: ${targetProfile.balance_ap}, Solicitados: ${diffDays}`)
    } else {
        // Only admins can create 'DO'
        if (!isAdmin) throw new Error('No autorizado para crear Descanso Obligatorio')
    }

    // Prevent overlapping requests of a different type (or duplicates) for the same user
    const { data: overlapping } = await supabase
        .from('requests')
        .select('id, type, start_date, end_date, status')
        .eq('user_id', effectiveUserId)
        .neq('status', 'cancelled')
        .lte('start_date', end_date)
        .gte('end_date', start_date)

    if (overlapping && overlapping.length > 0) {
        // If any existing overlapping request has a different type or same type, block creation
        throw new Error('Ya existe una solicitud solapada para estas fechas. No se permiten múltiples permisos en el mismo día.')
    }

    const effectiveSupabase = isAdmin ? createAdminClient() : supabase

    const { data: insertedRequest, error } = await effectiveSupabase
        .from('requests')
        .insert({
            user_id: effectiveUserId,
            type,
            start_date,
            end_date,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        throw new Error('Error al crear la solicitud: ' + error.message)
    }

    // Auto-approve if requested by admin
    if (isAdmin && auto_approve && insertedRequest) {
        const { error: approvalError } = await supabase.rpc('approve_request_with_capacity', { request_id: insertedRequest.id })
        if (approvalError) {
            console.error('Failed to auto-approve admin request:', approvalError)
            // We don't throw here to avoid user confusion, but could be logged or returned in state
        }

        // Regenerate availability
        try {
            const { regenerateDailyAvailability } = await import('@/app/admin/settings/capacity-actions')
            await regenerateDailyAvailability(new Date(start_date), new Date(end_date))
        } catch (e) {
            console.error('Failed to regenerate availability after admin auto-approval:', e)
        }
    }

    revalidatePath('/user/requests')
    revalidatePath('/user/dashboard')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/requests')

    if (isAdmin) {
        redirect('/admin/requests')
    } else {
        redirect('/user/dashboard')
    }
}
