import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ChatPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get current profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get all profiles for the contact list
    // In a large org, you might filter this based on section or only show active chats first.
    // For now, let's get all to allow "choose any contact".
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, section, avatar_url')
        .neq('id', user.id) // Don't chat with yourself
        .order('full_name')

    const backPath = profile?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-6rem)]">
            <div className="flex items-center gap-4 shrink-0 px-1">
                <Link
                    href={backPath}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-card px-4 py-2 rounded-lg border border-border shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Portal
                </Link>
                <div className="h-10 w-px bg-border/50 mx-2" />
                <h1 className="text-xl font-bold tracking-tight">Comunicación Interna</h1>
            </div>

            <div className="flex-1 min-h-[500px] flex flex-col bg-background border rounded-xl shadow-lg overflow-hidden">
                <ChatInterface
                    currentProfile={profile}
                    allProfiles={profiles || []}
                />
            </div>
        </div>
    )
}
