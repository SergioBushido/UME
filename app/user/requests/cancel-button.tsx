'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { cancelRequest } from "./actions"
import { Loader2, XCircle } from "lucide-react"

export function CancelButton({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleCancel() {
        if (!confirm('¿Seguro que quieres cancelar esta solicitud? Si ya estaba aprobada, se liberará el cupo.')) return
        setLoading(true)
        try {
            await cancelRequest(requestId)
        } catch (error) {
            console.error(error)
            alert('Error al cancelar la solicitud')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
            title="Cancelar solicitud"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            <span className="sr-only">Cancelar</span>
        </Button>
    )
}
