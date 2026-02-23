'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, Reply, Trash2, User as UserIcon, UserCheck, Pencil, Check, X } from 'lucide-react'
import { createPost, deletePost, updatePost } from '@/app/board/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Post {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        role: string
        section: string
        avatar_url?: string
    }
}

interface BoardPostProps {
    post: Post
    replies: Post[]
    currentUserId: string
    isAdmin: boolean
}

export function BoardPost({ post, replies, currentUserId, isAdmin }: BoardPostProps) {
    const [isReplyOpen, setIsReplyOpen] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Edit state
    const [isEditing, setIsEditing] = useState<string | null>(null) // ID of post/reply being edited
    const [editContent, setEditContent] = useState('')

    const handleReply = async () => {
        if (!replyContent.trim()) return
        setIsSubmitting(true)
        try {
            await createPost(replyContent, post.id)
            setReplyContent('')
            setIsReplyOpen(false)
            toast.success("Respuesta publicada")
        } catch (error) {
            toast.error("Error al publicar")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar este mensaje?")) return
        try {
            await deletePost(id)
            toast.success("Mensaje borrado")
        } catch (error) {
            toast.error("Error al borrar")
        }
    }

    const startEditing = (id: string, initialContent: string) => {
        setIsEditing(id)
        setEditContent(initialContent)
    }

    const handleUpdate = async (id: string) => {
        if (!editContent.trim()) return
        setIsSubmitting(true)
        try {
            await updatePost(id, editContent)
            setIsEditing(null)
            toast.success("Mensaje actualizado")
        } catch (error) {
            toast.error("Error al actualizar")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-border shadow-sm mb-6 overflow-hidden">
            <CardHeader className="bg-muted/30 p-4 border-b">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Avatar className={cn(
                            "h-10 w-10 border shadow-sm",
                            post.profiles.role === 'admin' ? "border-primary/30" : "border-border"
                        )}>
                            <AvatarImage src={post.profiles.avatar_url} />
                            <AvatarFallback className={cn(
                                post.profiles.role === 'admin' ? "bg-primary/10 text-primary" : "bg-background"
                            )}>
                                {post.profiles.role === 'admin' ? <UserCheck className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-bold flex items-center gap-2">
                                {post.profiles.full_name}
                                {post.profiles.role === 'admin' && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Mando</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                {post.profiles.section} • {format(new Date(post.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                            </p>
                        </div>
                    </div>
                    {/* ... middle ... */}
                    <div className="flex items-center gap-1">
                        {(currentUserId === post.user_id || isAdmin) && isEditing !== post.id && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => startEditing(post.id, post.content)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        {(currentUserId === post.user_id || isAdmin) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(post.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 bg-card">
                {isEditing === post.id ? (
                    <div className="space-y-3">
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(null)} className="h-8">
                                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                            </Button>
                            <Button size="sm" onClick={() => handleUpdate(post.id)} disabled={isSubmitting} className="h-8">
                                <Check className="h-3.5 w-3.5 mr-1" /> Guardar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                )}

                <div className="mt-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 px-2 text-muted-foreground hover:text-primary"
                        onClick={() => setIsReplyOpen(!isReplyOpen)}
                    >
                        <Reply className="mr-2 h-3.5 w-3.5" />
                        Responder
                    </Button>
                    {replies.length > 0 && (
                        <div className="text-[10px] text-muted-foreground flex items-center">
                            <MessageSquare className="mr-1 h-3 w-3" />
                            {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
                        </div>
                    )}
                </div>

                {/* Reply Form */}
                {isReplyOpen && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="text-sm min-h-[80px] bg-muted/20"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsReplyOpen(false)} className="text-xs">Cancelar</Button>
                            <Button size="sm" onClick={handleReply} disabled={isSubmitting} className="text-xs">
                                {isSubmitting ? "Enviando..." : "Publicar respuesta"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Replies List */}
                {replies.length > 0 && (
                    <div className="mt-6 space-y-4 pt-4 border-t border-border/40">
                        {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-primary/20 group">
                                <Avatar className="h-8 w-8 border shadow-sm shrink-0">
                                    <AvatarImage src={reply.profiles.avatar_url} />
                                    <AvatarFallback className="bg-muted text-[10px]">
                                        <UserIcon className="h-3 w-3" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <span className="text-[11px] font-bold">{reply.profiles.full_name}</span>
                                            <span className="text-[9px] text-muted-foreground ml-2">
                                                {format(new Date(reply.created_at), "HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(currentUserId === reply.user_id || isAdmin) && isEditing !== reply.id && (
                                                <button
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    onClick={() => startEditing(reply.id, reply.content)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            )}
                                            {(currentUserId === reply.user_id || isAdmin) && (
                                                <button
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                    onClick={() => handleDelete(reply.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isEditing === reply.id ? (
                                        <div className="mt-2 space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="min-h-[60px] text-xs"
                                            />
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(null)} className="h-6 w-8 p-0">
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" onClick={() => handleUpdate(reply.id)} disabled={isSubmitting} className="h-6 w-8 p-0">
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">{reply.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
