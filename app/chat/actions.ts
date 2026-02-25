'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function sendMessage(receiverId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('messages')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content,
            is_read: false
        })

    if (error) throw new Error(error.message)

    revalidatePath('/chat')
    return { success: true }
}

export async function markAsRead(senderId: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error("[CHAT] Unauthorized markAsRead attempt")
        throw new Error("Unauthorized")
    }

    console.log(`[CHAT] Marking messages from ${senderId} to ${user.id} as read...`)

    const { data, error } = await adminSupabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId)
        .eq('is_read', false)
        .select()

    if (error) {
        console.error("[CHAT] Error marking as read:", error)
        throw new Error(error.message)
    }

    console.log(`[CHAT] Successfully marked ${data?.length || 0} messages as read.`)

    revalidatePath('/chat')
    revalidatePath('/user/dashboard')
    revalidatePath('/admin/dashboard')
    revalidatePath('/', 'layout')
    return { success: true }
}
