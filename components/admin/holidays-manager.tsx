'use client'

import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { addHoliday, deleteHoliday } from '@/app/admin/settings/holidays-actions'

interface Holiday {
    date: string
    description: string
}

interface Props {
    initialHolidays: Holiday[]
}

export function HolidaysManager({ initialHolidays }: Props) {
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState('')
    const [desc, setDesc] = useState('')

    const handleAdd = async () => {
        if (!date) return toast.error('Selecciona una fecha')
        setLoading(true)
        try {
            await addHoliday(date, desc || 'Festivo')
            toast.success('Festivo añadido')
            setDate('')
            setDesc('')
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (d: string) => {
        try {
            await deleteHoliday(d)
            toast.success('Festivo eliminado')
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="grid w-full gap-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="grid w-full gap-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Descripción</Label>
                    <Input type="text" placeholder="Ej: Navidad" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <Button onClick={handleAdd} disabled={loading || !date} className="shrink-0 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2"/> Añadir
                </Button>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t">
                {initialHolidays.map((h) => (
                    <div key={h.date} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                        <div>
                            <p className="font-medium text-sm">{h.date}</p>
                            <p className="text-xs text-muted-foreground">{h.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(h.date)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                
                {initialHolidays.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground">No hay festivos configurados.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
