'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatSidebar } from './sidebar'
import { ChatConversation } from './conversation'
import { markAsRead } from '../../app/chat/actions'
import { cn } from '@/lib/utils'

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
    section: string
}

interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    is_read: boolean
    created_at: string
}

interface ChatInterfaceProps {
    currentProfile: any
    allProfiles: Profile[]
}

export function ChatInterface({ currentProfile, allProfiles }: ChatInterfaceProps) {
    const [selectedContact, setSelectedContact] = useState<Profile | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const supabase = createClient()

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const fetchMessages = useCallback(async (contactId: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentProfile.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentProfile.id})`)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setMessages(data)
            // Mark as read when opening conversation
            await markAsRead(contactId)
        }
        setLoading(false)
    }, [currentProfile.id, supabase])

    useEffect(() => {
        if (selectedContact) {
            // Avoid calling setState in the same render cycle if possible, 
            // though here it's inside an effect which is generally okay 
            // but the lint is complaining about fetchMessages internal setStatus.
            // We can wrap it in a microtask or just ignore if it's not actually loops.
            fetchMessages(selectedContact.id)
        } else {
            setMessages([])
        }
    }, [selectedContact?.id, fetchMessages])

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentProfile.id}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    if (selectedContact && newMsg.sender_id === selectedContact.id) {
                        setMessages(prev => [...prev, newMsg])
                        markAsRead(selectedContact.id).catch(console.error)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentProfile.id}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    if (selectedContact && newMsg.receiver_id === selectedContact.id) {
                        setMessages(prev => [...prev, newMsg])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentProfile.id, selectedContact, supabase])

    return (
        <div className="flex flex-1 overflow-hidden h-full relative">
            {/* Sidebar - hidden on mobile if contact selected */}
            <div className={cn(
                "h-full shrink-0 border-r transition-all duration-300",
                isMobile ? (selectedContact ? "hidden" : "w-full") : "w-80"
            )}>
                <ChatSidebar
                    profiles={allProfiles}
                    selectedId={selectedContact?.id}
                    onSelect={setSelectedContact}
                    currentUserId={currentProfile.id}
                />
            </div>

            {/* Conversation Area - hidden on mobile if no contact selected */}
            <div className={cn(
                "flex-1 flex flex-col bg-muted/5 transition-all duration-300",
                isMobile && !selectedContact ? "hidden" : "flex"
            )}>
                {selectedContact ? (
                    <ChatConversation
                        contact={selectedContact}
                        messages={messages}
                        currentUserId={currentProfile.id}
                        loading={loading}
                        onBack={isMobile ? () => setSelectedContact(null) : undefined}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <div className="bg-primary/10 p-6 rounded-full mb-4">
                            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">WhatsApp UME</h3>
                        <p className="max-w-xs mt-2">Selecciona un contacto lateral para iniciar una conversación segura.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
