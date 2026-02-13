'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const receiverId = formData.get('receiverId') as string
    const content = formData.get('content') as string

    if (!receiverId || !content) {
        throw new Error('Faltan datos')
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content
        })

    if (error) {
        console.error('Error sending message:', error)
        throw new Error('Error enviando mensaje')
    }

    revalidatePath(`/admin/users/${receiverId}`)
}
