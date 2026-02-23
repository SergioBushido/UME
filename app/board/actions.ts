'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPost(content: string, parentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Acceso denegado")
    if (!content.trim()) throw new Error("El contenido no puede estar vacío")

    const { error } = await supabase
        .from('board_posts')
        .insert({
            user_id: user.id,
            content: content.trim(),
            parent_id: parentId || null
        })

    if (error) throw new Error(error.message)

    revalidatePath('/board')
}

export async function deletePost(postId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Acceso denegado")

    // RLS will handle the permission check (owner or admin)
    const { error } = await supabase
        .from('board_posts')
        .delete()
        .eq('id', postId)

    if (error) throw new Error(error.message)

    revalidatePath('/board')
}
export async function updatePost(postId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Acceso denegado")
    if (!content.trim()) throw new Error("El contenido no puede estar vacío")

    const { error } = await supabase
        .from('board_posts')
        .update({ content: content.trim() })
        .eq('id', postId)

    if (error) throw new Error(error.message)

    revalidatePath('/')
    revalidatePath('/user/dashboard')
    revalidatePath('/admin/dashboard')
}
