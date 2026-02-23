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
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface User {
    id: string
    email: string
    full_name: string | null
    section: string | null
    role: string | null
    balance_po: number | null
    balance_da: number | null
    balance_ap: number | null
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
                role: formData.get('role') as string,
                po: Number(formData.get('po')),
                da: Number(formData.get('da')),
                ap: Number(formData.get('ap')),
            })
            setOpen(false)
            toast.success("Usuario actualizado correctamente")
        } catch (error) {
            toast.error("Error al actualizar usuario")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del usuario, rol y cuotas de permisos.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nombre Completo</Label>
                                <Input id="full_name" name="full_name" defaultValue={user.full_name || ''} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={user.email} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol de Usuario</Label>
                                <Select name="role" defaultValue={user.role || 'user'} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Usuario</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="po">Total PO</Label>
                                <Input id="po" name="po" type="number" defaultValue={user.balance_po || 22} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="da">Total DA</Label>
                                <Input id="da" name="da" type="number" defaultValue={user.balance_da || 6} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ap">Total AP</Label>
                                <Input id="ap" name="ap" type="number" defaultValue={user.balance_ap || 4} required />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
