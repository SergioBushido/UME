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
import { updateUser } from './actions'
import { Pencil } from "lucide-react"

interface User {
    id: string
    email: string
    full_name: string | null
    section: string | null
}

export function EditUserDialog({ user }: { user: User }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            await updateUser(user.id, {
                email: formData.get('email') as string,
                fullName: formData.get('full_name') as string,
                section: formData.get('section') as string,
            })
            setOpen(false)
        } catch (error) {
            alert('Error updating user')
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
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del usuario.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre Completo</Label>
                            <Input id="full_name" name="full_name" defaultValue={user.full_name || ''} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={user.email} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="section">Sección</Label>
                            <Select name="section" defaultValue={user.section || '1er Peloton'} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona sección" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1er Peloton">1er Peloton</SelectItem>
                                    <SelectItem value="2 Peloton">2 Peloton</SelectItem>
                                </SelectContent>
                            </Select>
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
