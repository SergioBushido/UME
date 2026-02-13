'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-casting here for convenience
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // In a real app, you might want to return the error to the client
        // to display it in the form. For now, we'll redirect with an error param.
        return redirect('/login?error=Invalid credentials')
    }

    // Check user role
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') {
            revalidatePath('/', 'layout')
            return redirect('/admin/dashboard')
        } else {
            revalidatePath('/', 'layout')
            return redirect('/user/dashboard')
        }
    }

    return redirect('/login')
}
