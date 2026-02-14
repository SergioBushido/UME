'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateRequest } from './actions'
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface Request {
    id: string
    type: string
    start_date: string
    end_date: string
    profiles?: any // Simplified for now since we just display name
}

export function EditRequestDialog({ request }: { request: Request }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await updateRequest(request.id, {
                type: formData.get('type') as 'PO' | 'DA' | 'AP',
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') as string,
            })
            setOpen(false)
            toast.success("Solicitud actualizada correctamente")
        } catch (error) {
            toast.error("Error al actualizar solicitud")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Solicitud</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la solicitud de {request.profiles?.full_name || request.profiles?.email}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select name="type" defaultValue={request.type} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PO">Permiso Oficial (PO)</SelectItem>
                                    <SelectItem value="DA">Días Adicionales (DA)</SelectItem>
                                    <SelectItem value="AP">Asuntos Propios (AP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Desde</Label>
                                <Input type="date" name="start_date" defaultValue={request.start_date} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Hasta</Label>
                                <Input type="date" name="end_date" defaultValue={request.end_date} required />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
