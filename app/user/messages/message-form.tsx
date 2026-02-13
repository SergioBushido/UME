"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendMessage } from "./actions"

export function MessageForm() {
    const [content, setContent] = useState("")
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsPending(true)
        try {
            await sendMessage(content)
            setContent("")
        } catch (error) {
            console.error("Failed to send message:", error)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
                placeholder="Escribe tu mensaje..."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                className="min-h-[60px] resize-none flex-1"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                    }
                }}
            />
            <Button type="submit" size="icon" disabled={!content.trim() || isPending} className="h-[60px] w-[60px]">
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
            </Button>
        </form>
    )
}
