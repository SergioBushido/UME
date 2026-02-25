'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function StickyChatIcon() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [senders, setSenders] = useState<string[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    // Don't show the icon on the chat page itself
    const isChatPage = pathname === '/chat' || pathname.includes('/messages')

    const fetchUnreadData = useCallback(async (id: string) => {
        // Fetch unread messages with sender info
        const { data, error } = await supabase
            .from('messages')
            .select(`
                sender_id,
                profiles:sender_id (full_name)
            `)
            .eq('receiver_id', id)
            .eq('is_read', false)

        if (!error && data) {
            setUnreadCount(data.length)

            // Get unique sender names
            const uniqueSenders = Array.from(new Set(
                data.map(m => (m.profiles as any)?.full_name).filter(Boolean)
            )) as string[]

            setSenders(uniqueSenders)
        }
    }, [supabase])

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                fetchUnreadData(user.id)
            }
        }
        fetchUser()

        // Use a stable reference to userId for the subscription
        const currentUserId = userId

        // Real-time subscription for new messages and status changes
        const channel = supabase
            .channel('unread_messages_sync')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    const msg = payload.new as any || payload.old as any
                    // Re-fetch if:
                    // 1. The message clearly belongs to the current user
                    // 2. OR it's an UPDATE (which might have partial data)
                    if (currentUserId && (msg?.receiver_id === currentUserId || payload.eventType === 'UPDATE')) {
                        fetchUnreadData(currentUserId)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase, fetchUnreadData])

    if (isChatPage) return null

    return (
        <button
            onClick={() => router.push('/chat')}
            className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
            title="Chat Interno"
        >
            <MessageSquare className="h-6 w-6" />

            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce border-2 border-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}

            {/* Tooltip hint */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-border/50 min-w-[120px]">
                <p className="font-bold border-b border-border/50 pb-1 mb-1">Chat UME</p>
                {unreadCount > 0 ? (
                    <div className="space-y-1">
                        <p className="text-primary font-medium">{unreadCount} mensajes nuevos</p>
                        <div className="text-[10px] text-muted-foreground">
                            De: {senders.join(', ')}
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-[10px]">Sin mensajes nuevos</p>
                )}
            </div>
        </button>
    )
}
