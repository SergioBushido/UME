'use client'

import { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { sendMessage } from './actions'

export function MessageForm({ receiverId }: { receiverId: string }) {
    const formRef = useRef<HTMLFormElement>(null)

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await sendMessage(formData)
                formRef.current?.reset()
            }}
            className="flex gap-4 items-end"
        >
            <input type="hidden" name="receiverId" value={receiverId} />
            <Textarea
                name="content"
                placeholder="Escribe un mensaje..."
                className="flex-1 min-h-[80px]"
            />
            <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
            </Button>
        </form>
    )
}
