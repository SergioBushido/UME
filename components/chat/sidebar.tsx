import React, { useState, useEffect } from 'react'
import { Search, User as UserIcon, Shield, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
    section: string
    avatar_url?: string
}

interface ChatSidebarProps {
    profiles: Profile[]
    selectedId?: string
    onSelect: (profile: Profile) => void
    currentUserId: string
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ChatSidebar({ profiles, selectedId, onSelect, currentUserId }: ChatSidebarProps) {
    const [search, setSearch] = useState('')
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const supabase = createClient()

    useEffect(() => {
        const fetchUnreadCounts = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('sender_id')
                .eq('receiver_id', currentUserId)
                .eq('is_read', false)

            if (!error && data) {
                const counts: Record<string, number> = {}
                data.forEach(msg => {
                    counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1
                })
                setUnreadCounts(counts)
            }
        }

        fetchUnreadCounts()

        // Real-time subscription
        const channel = supabase
            .channel('sidebar_unread_sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    fetchUnreadCounts()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId, supabase])

    const filteredProfiles = profiles.filter(p =>
        (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.section || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="w-80 border-r flex flex-col bg-card">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold mb-4">Contactos</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar personal..."
                        className="pl-9 bg-muted/50 border-none h-9 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredProfiles.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No se encontraron contactos.
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filteredProfiles.map((profile) => {
                            const unread = unreadCounts[profile.id] || 0
                            return (
                                <button
                                    key={profile.id}
                                    onClick={() => onSelect(profile)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 relative overflow-hidden",
                                        selectedId === profile.id && "bg-primary/5",
                                        unread > 0 && "bg-primary/[0.02]"
                                    )}
                                >
                                    {selectedId === profile.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}

                                    <div className="shrink-0 relative">
                                        <Avatar className={cn(
                                            "h-10 w-10 border",
                                            profile.role === 'admin' ? "border-primary/20" : "border-border"
                                        )}>
                                            <AvatarImage src={profile.avatar_url} />
                                            <AvatarFallback className={cn(
                                                profile.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted"
                                            )}>
                                                {profile.role === 'admin' ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        {unread > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-background animate-pulse z-10">
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className={cn(
                                                "text-sm font-semibold truncate",
                                                selectedId === profile.id && "text-primary",
                                                unread > 0 && "font-extrabold"
                                            )}>
                                                {profile.full_name}
                                            </p>
                                            {unread > 0 && (
                                                <MessageSquare className="h-3 w-3 text-red-600 animate-bounce" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                {profile.section}
                                            </span>
                                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                                {profile.role}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
