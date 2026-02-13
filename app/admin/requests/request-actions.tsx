'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateRequestStatus } from './actions'
import { EditRequestDialog } from './edit-request-dialog'

interface Request {
    id: string
    type: string
    start_date: string
    end_date: string
    profiles?: any
}

export function RequestActions({ request }: { request: Request }) {
    const [rejectOpen, setRejectOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleApprove = async () => {
        if (!confirm('¿Aprobar solicitud?')) return
        setLoading(true)
        try {
            await updateRequestStatus(request.id, 'approved')
        } catch (error) {
            alert('Error')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const reason = formData.get('reason') as string

        try {
            await updateRequestStatus(request.id, 'rejected', reason)
            setRejectOpen(false)
        } catch (error) {
            alert('Error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-end gap-2 items-center">
            <EditRequestDialog request={request} />

            <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={loading}
            >
                <Check className="h-4 w-4" />
            </Button>

            <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={loading}
            >
                <X className="h-4 w-4" />
            </Button>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Solicitud</DialogTitle>
                        <DialogDescription>
                            Indique un motivo para el rechazo (opcional).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReject}>
                        <div className="grid gap-4 py-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="reason">Motivo</Label>
                                <Textarea id="reason" name="reason" placeholder="Indique el motivo..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={loading}>
                                {loading ? 'Rechazando...' : 'Rechazar Solicitud'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
