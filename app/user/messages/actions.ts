'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function sendMessage(content: string) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Find an admin to send the message to
    // In a real app, we might want to let the user choose, or assign a specific admin.
    // For now, we'll pick the first admin found.
    const { data: admin, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

    if (adminError || !admin) {
        throw new Error("No available admin to receive the message.")
    }

    // Insert message
    const { error } = await supabase
        .from('messages')
        .insert({
            sender_id: user.id,
            receiver_id: admin.id,
            content,
            is_read: false
        })

    if (error) {
        throw new Error("Failed to send message")
    }

    revalidatePath('/user/messages')
    revalidatePath(`/admin/users/${user.id}`) // Revalidate admin view as well
}
