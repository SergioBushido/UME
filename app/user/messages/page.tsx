import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageForm } from './message-form'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { redirect } from 'next/navigation'

export default async function MessagesPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Messages
    const { data: messages } = await supabase
        .from('messages')
        .select(`
            *,
            sender:sender_id(full_name, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mensajes</h2>
                <p className="text-muted-foreground">Comunícate directamentee con la administración.</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-3 border-b">
                    <CardTitle className="text-base">Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                        {messages?.map((msg) => {
                            const isMe = msg.sender_id === user.id

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {format(new Date(msg.created_at), 'Pp', { locale: es })}
                                    </span>
                                </div>
                            )
                        })}
                        {messages?.length === 0 && (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No hay mensajes. Escribe el primero para contactar con administración.
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background">
                        <MessageForm />
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
