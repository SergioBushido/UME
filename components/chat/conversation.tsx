'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, User as UserIcon, Shield, MoreVertical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { sendMessage } from '../../app/chat/actions'
import { cn } from '@/lib/utils'

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
    section: string
    avatar_url?: string
}

interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    is_read: boolean
    created_at: string
}

interface ChatConversationProps {
    contact: Profile
    messages: Message[]
    currentUserId: string
    loading: boolean
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ChatConversation({ contact, messages, currentUserId, loading }: ChatConversationProps) {
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || sending) return

        setSending(true)
        try {
            await sendMessage(contact.id, input.trim())
            setInput('')
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className={cn(
                        "h-10 w-10 border shadow-sm",
                        contact.role === 'admin' ? "border-primary/20" : "border-border"
                    )}>
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback className={cn(
                            contact.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted"
                        )}>
                            {contact.role === 'admin' ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{contact.full_name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{contact.section} • {contact.role}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scroll-smooth"
            >
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId
                            return (
                                <div key={msg.id} className={cn(
                                    "flex flex-col",
                                    isMe ? "items-end" : "items-start"
                                )}>
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-card border border-border/50 rounded-tl-none text-foreground"
                                    )}>
                                        <p className="leading-relaxed">{msg.content}</p>
                                        <div className={cn(
                                            "text-[9px] mt-1 flex items-center gap-1 opacity-70",
                                            isMe ? "justify-end text-primary-foreground/80" : "text-muted-foreground"
                                        )}>
                                            {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                                            {isMe && (
                                                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                    {msg.is_read && <path d="M10.354 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" transform="translate(3, 0)" />}
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {messages.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-muted px-4 py-2 rounded-full text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-4">
                                    Inicio de la conversación
                                </div>
                                <p className="text-xs text-muted-foreground max-w-[200px]">Di hola a {contact.full_name} para empezar el chat.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-card shrink-0">
                <form onSubmit={handleSend} className="flex gap-2 relative">
                    <Input
                        placeholder="Escribe un mensaje..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-muted/30 border-none pr-12 focus-visible:ring-primary rounded-full h-11 px-6 shadow-inner"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full h-11 w-11 shrink-0 shadow-lg"
                        disabled={!input.trim() || sending}
                    >
                        {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
