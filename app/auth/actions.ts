'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updatePassword(password: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("No autorizado")
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function updateAvatarUrl(avatarUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("No autorizado")
    }

    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
