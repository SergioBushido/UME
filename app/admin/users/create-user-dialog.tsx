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
import { createUser } from './actions'
import { Plus } from "lucide-react"

export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const fullName = formData.get('full_name') as string
        const password = formData.get('password') as string
        const po = Number(formData.get('po'))
        const da = Number(formData.get('da'))
        const ap = Number(formData.get('ap'))
        const section = formData.get('section') as string

        try {
            await createUser({ email, fullName, password, po, da, ap, section })
            setOpen(false)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Error al crear usuario')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo empleado y asigna sus cuotas iniciales.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="full_name" className="text-right">Nombre</Label>
                            <Input id="full_name" name="full_name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">Contraseña</Label>
                            <Input id="password" name="password" type="password" className="col-span-3" required minLength={6} placeholder="Mínimo 6 caracteres" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="section" className="text-right">Sección</Label>
                            <Select name="section" defaultValue="1er Peloton" required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona sección" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1er Peloton">1er Peloton</SelectItem>
                                    <SelectItem value="2 Peloton">2 Peloton</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="po" className="text-right">Total PO</Label>
                            <Input id="po" name="po" type="number" defaultValue={22} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="da" className="text-right">Total DA</Label>
                            <Input id="da" name="da" type="number" defaultValue={6} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ap" className="text-right">Total AP</Label>
                            <Input id="ap" name="ap" type="number" defaultValue={4} className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Usuario'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
