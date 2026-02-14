'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { upsertPresenceRule, deletePresenceRule, type PresenceRule } from './capacity-actions'
import { format } from 'date-fns'
import { toast } from "sonner"
import { Trash } from "lucide-react"

export function RulesTab({ rules }: { rules: PresenceRule[] }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await upsertPresenceRule({
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') ? formData.get('end_date') as string : null,
                min_presence_percent: Number(formData.get('min_presence_percent')),
                description: formData.get('description') as string
            })
            toast.success("Regla guardada correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar regla")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta regla?')) return
        await deletePresenceRule(id)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Nueva Regla de Presencia</CardTitle>
                    <CardDescription>Define el porcentaje mínimo de personal requerido.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Fecha Inicio</Label>
                                <Input type="date" name="start_date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Fecha Fin (Opcional)</Label>
                                <Input type="date" name="end_date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="min_presence_percent">% Mínimo Presencia</Label>
                                <Input type="number" name="min_presence_percent" required min="0" max="100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <Input type="text" name="description" placeholder="Ej. Verano, Navidad..." />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Regla'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Reglas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Inicio</TableHead>
                                <TableHead>Fin</TableHead>
                                <TableHead>% Mínimo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules?.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>{format(new Date(rule.start_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        {rule.end_date ? format(new Date(rule.end_date), 'dd/MM/yyyy') : 'Indefinido'}
                                    </TableCell>
                                    <TableCell>{rule.min_presence_percent}%</TableCell>
                                    <TableCell>{rule.description || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => rule.id && handleDelete(rule.id)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rules?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No hay reglas configuradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
