'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { upsertStaffLevel, deleteStaffLevel, type StaffLevel } from './capacity-actions'
import { format } from 'date-fns'
import { Trash } from "lucide-react"

export function StaffTab({ levels }: { levels: StaffLevel[] }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await upsertStaffLevel({
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') ? formData.get('end_date') as string : null,
                total_staff: Number(formData.get('total_staff'))
            })
        } catch (error) {
            console.error(error)
            alert('Error al guardar plantilla')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return
        await deleteStaffLevel(id)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Nueva Configuración de Plantilla</CardTitle>
                    <CardDescription>Define el número total de efectivos para un periodo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Fecha Inicio</Label>
                                <Input type="date" name="start_date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Fecha Fin (Opcional)</Label>
                                <Input type="date" name="end_date" />
                                <p className="text-xs text-muted-foreground">Dejar vacío para indefinido</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="total_staff">Total Efectivos</Label>
                                <Input type="number" name="total_staff" required min="1" />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Periodo'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Plantilla</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Inicio</TableHead>
                                <TableHead>Fin</TableHead>
                                <TableHead>Total Efectivos</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {levels?.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell>{format(new Date(level.start_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        {level.end_date ? format(new Date(level.end_date), 'dd/MM/yyyy') : 'Indefinido'}
                                    </TableCell>
                                    <TableCell>{level.total_staff}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => level.id && handleDelete(level.id)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {levels?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No hay registros configurados.
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
