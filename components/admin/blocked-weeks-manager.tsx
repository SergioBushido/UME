'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface DateRange {
    start: string
    end: string
}

interface BlockedWeeksManagerProps {
    initialRanges: DateRange[]
}

export function BlockedWeeksManager({ initialRanges }: BlockedWeeksManagerProps) {
    const [ranges, setRanges] = useState<DateRange[]>(initialRanges)

    const addRange = () => {
        setRanges([...ranges, { start: '', end: '' }])
    }

    const removeRange = (index: number) => {
        setRanges(ranges.filter((_, i) => i !== index))
    }

    const updateRange = (index: number, field: keyof DateRange, value: string) => {
        const newRanges = [...ranges]
        newRanges[index][field] = value
        setRanges(newRanges)
    }

    return (
        <div className="space-y-4">
            <input type="hidden" name="value" value={JSON.stringify(ranges)} />

            <div className="space-y-3">
                {ranges.map((range, index) => (
                    <Card key={index} className="bg-muted/30 border-dashed">
                        <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row items-end gap-3">
                                <div className="grid w-full gap-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Inicio</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            value={range.start}
                                            onChange={(e) => updateRange(index, 'start', e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="grid w-full gap-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fin</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            value={range.end}
                                            onChange={(e) => updateRange(index, 'end', e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRange(index)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {ranges.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">No hay semanas bloqueadas configuradas.</p>
                </div>
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRange}
                className="w-full border-dashed"
            >
                <Plus className="mr-2 h-4 w-4" /> Añadir Rango de Bloqueo
            </Button>
        </div>
    )
}
