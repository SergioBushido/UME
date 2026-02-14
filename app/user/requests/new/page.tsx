'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRequest } from './actions'
import { getDailyAvailability } from '@/app/admin/settings/capacity-actions'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { eachDayOfInterval, format, parseISO } from 'date-fns'

export default function NewRequestPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // State for dates to check availability
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [availabilityCheck, setAvailabilityCheck] = useState<{ valid: boolean, message: string, details?: string } | null>(null)

    useEffect(() => {
        async function check() {
            if (!startDate || !endDate) {
                setAvailabilityCheck(null)
                return
            }

            const start = parseISO(startDate)
            const end = parseISO(endDate)

            if (start > end) {
                setAvailabilityCheck({ valid: false, message: 'La fecha de fin debe ser posterior a la de inicio' })
                return
            }

            try {
                const data = await getDailyAvailability(startDate, endDate)
                const days = eachDayOfInterval({ start, end })

                let invalidDays = []

                for (const day of days) {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const daily = data?.find(d => d.date === dateStr)

                    if (!daily) {
                        // Assumption: missing config = blocked or just warning? 
                        // Backend blocks, so we verify here.
                        invalidDays.push(`${dateStr} (Sin configuración)`)
                        continue
                    }

                    if (daily.is_locked) {
                        invalidDays.push(`${dateStr} (Bloqueado)`)
                        continue
                    }

                    const remaining = daily.max_absence - daily.approved_count
                    if (remaining <= 0) {
                        invalidDays.push(`${dateStr} (Sin cupo)`)
                    }
                }

                if (invalidDays.length > 0) {
                    setAvailabilityCheck({
                        valid: false,
                        message: `No hay disponibilidad para: ${invalidDays.length} días.`,
                        details: invalidDays.slice(0, 3).join(', ') + (invalidDays.length > 3 ? '...' : '')
                    })
                } else {
                    setAvailabilityCheck({ valid: true, message: 'Hay cupo disponible para todos los días seleccionados.' })
                }
            } catch (e) {
                console.error(e)
            }
        }

        check()
    }, [startDate, endDate])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (availabilityCheck && !availabilityCheck.valid) {
            setError('No puedes enviar la solicitud porque no hay disponibilidad en las fechas seleccionadas.')
            return
        }

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
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
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
                                <Input
                                    type="date"
                                    id="start_date"
                                    name="start_date"
                                    required
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Fecha Fin</Label>
                                <Input
                                    type="date"
                                    id="end_date"
                                    name="end_date"
                                    required
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {availabilityCheck && (
                            <Alert variant={availabilityCheck.valid ? "default" : "destructive"} className={availabilityCheck.valid ? "border-green-500 bg-green-50 dark:bg-green-900/10" : ""}>
                                {availabilityCheck.valid ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle>{availabilityCheck.valid ? "Disponible" : "No Disponible"}</AlertTitle>
                                <AlertDescription>
                                    {availabilityCheck.message}
                                    {availabilityCheck.details && <div className="text-xs mt-1 font-mono">{availabilityCheck.details}</div>}
                                </AlertDescription>
                            </Alert>
                        )}

                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
                        <Button type="submit" disabled={loading || (availabilityCheck ? !availabilityCheck.valid : false)}>
                            {loading ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
