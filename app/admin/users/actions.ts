'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserBalances(userId: string, data: { po: number, da: number, ap: number }) {
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

    const { data: updatedUser, error } = await supabase
        .from('profiles')
        .update({
            balance_po: data.po,
            balance_da: data.da,
            balance_ap: data.ap
        })
        .eq('id', userId)
        .select()

    if (error) {
        throw new Error('Error al actualizar')
    }

    if (!updatedUser || updatedUser.length === 0) {
        throw new Error('No se pudo actualizar el usuario (No encontrado o permisos insuficientes)')
    }

    revalidatePath('/admin/users')
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function createUser(data: { email: string, fullName: string, password: string, po: number, da: number, ap: number, section: string }) {
    try {
        console.log('Action: createUser started for', data.email)
        const supabase = await createClient()

        // Verify admin
        const { data: { user }, error: authUserError } = await supabase.auth.getUser()
        if (authUserError) {
            console.error('Auth verification error:', authUserError)
            return { error: 'Error de autenticación: ' + authUserError.message }
        }
        if (!user) return { error: 'No autenticado' }

        const { data: adminProfile, error: adminProfileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfileError || adminProfile?.role !== 'admin') {
            console.error('Admin verification failed:', adminProfileError)
            return { error: 'No autorizado o error al verificar permisos' }
        }

        console.log('Admin verified, creating auth user...')
        const adminSupabase = createAdminClient()

        // Create auth user
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName
            }
        })

        if (createError) {
            console.error('Supabase Auth Admin error:', createError)
            return { error: 'Error al crear usuario en Auth: ' + createError.message }
        }

        if (!newUser.user) return { error: 'Error al crear usuario: No se recibió respuesta de Auth' }

        console.log('Auth user created:', newUser.user.id, 'Creating/updating profile...')

        // Use upsert to handle case where profile trigger hasn't finished
        // and explicitly set full_name from data.fullName
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: data.email,
                full_name: data.fullName,
                balance_po: data.po,
                balance_da: data.da,
                balance_ap: data.ap,
                section: data.section,
                role: 'user' // Default to user on creation
            })

        if (profileError) {
            console.error('Profile upsert error:', profileError)
            return { error: 'Usuario creado pero error al asignar perfil/cuotas: ' + profileError.message }
        }

        console.log('Profile created successfully. Revalidating path...')
        revalidatePath('/admin/users')
        return { success: true }
    } catch (e: any) {
        console.error('CRITICAL ERROR in createUser action:', e)
        return { error: e.message || 'Error inesperado en el servidor' }
    }
}

export async function updateUser(userId: string, data: {
    email: string,
    fullName: string,
    section: string,
    role: string,
    po: number,
    da: number,
    ap: number
}) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') throw new Error('No autorizado')

    const adminSupabase = createAdminClient()

    // Update Auth (Email + Metadata)
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
        email: data.email,
        email_confirm: true,
        user_metadata: { full_name: data.fullName }
    })

    if (authError) throw new Error(`Error actualizando auth: ${authError.message}`)

    // Update Profile (Section + FullName + Role + Balances)
    const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({
            section: data.section,
            full_name: data.fullName,
            role: data.role,
            balance_po: data.po,
            balance_da: data.da,
            balance_ap: data.ap
        })
        .eq('id', userId)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error(`Error actualizando perfil: ${profileError.message}`)
    }

    revalidatePath('/admin/users')
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin') throw new Error('No autorizado')

    const adminSupabase = createAdminClient()

    // Delete profile first (since it might trigger cascades or just to be sure)
    const { error: profileError } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (profileError) {
        console.error('Error deleting profile:', profileError)
        // Continue to try deleting auth user even if profile delete fails (maybe it's already gone)
    }

    // Delete requests for this user manually if cascade is missing
    const { error: requestsError } = await adminSupabase
        .from('requests')
        .delete()
        .eq('user_id', userId)

    if (requestsError) {
        console.error('Error deleting user requests:', requestsError)
    }

    const { error } = await adminSupabase.auth.admin.deleteUser(userId)

    if (error) throw new Error(`Error eliminando usuario: ${error.message}`)

    revalidatePath('/admin/users')
}
