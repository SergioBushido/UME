'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRequest(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const type = formData.get('type') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string

    if (!type || !start_date || !end_date) {
        throw new Error('Todos los campos son obligatorios')
    }

    // Validate dates
    const start = new Date(start_date)
    const end = new Date(end_date)

    if (start > end) {
        throw new Error('La fecha de fin no puede ser anterior a la de inicio')
    }

    // Check balance? (Optional hard constraint, or just check logic)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

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

    // Check balance
    if (type === 'PO' && (profile.balance_po || 0) < diffDays) throw new Error(`Saldo insuficiente de PO. Disponibles: ${profile.balance_po}, Solicitados: ${diffDays}`)
    if (type === 'DA' && (profile.balance_da || 0) < diffDays) throw new Error(`Saldo insuficiente de DA. Disponibles: ${profile.balance_da}, Solicitados: ${diffDays}`)
    if (type === 'AP' && (profile.balance_ap || 0) < diffDays) throw new Error(`Saldo insuficiente de AP. Disponibles: ${profile.balance_ap}, Solicitados: ${diffDays}`)

    const { error } = await supabase.from('requests').insert({
        user_id: user.id,
        type,
        start_date,
        end_date,
        status: 'pending'
    })

    if (error) {
        throw new Error('Error al crear la solicitud: ' + error.message)
    }

    revalidatePath('/user/requests')
    redirect('/user/requests')
}
