'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRequest } from './actions'

export default function NewRequestPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        try {
            await createRequest(formData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la solicitud')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Nueva Solicitud</CardTitle>
                    <CardDescription>Completa el formulario para solicitar días de ausencia.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo de Solicitud</Label>
                            <Select name="type" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el tipo" />
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
                                <Label htmlFor="start_date">Fecha Inicio</Label>
                                <Input type="date" id="start_date" name="start_date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Fecha Fin</Label>
                                <Input type="date" id="end_date" name="end_date" required />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
