'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BlockedWeeksManager } from '@/components/admin/blocked-weeks-manager'
import { updateSettings } from './actions'

interface Props {
    initialRanges: { start: string, end: string }[]
}

export default function SettingsForm({ initialRanges }: Props) {
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        try {
            const result: any = await updateSettings(formData)
            if (result?.success) {
                toast.success('Configuración guardada')
                router.refresh()
            } else {
                toast.error('No se pudo guardar la configuración')
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error al guardar configuración')
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="key" value="blocked_weeks" />
            <div className="space-y-6">
                <BlockedWeeksManager initialRanges={initialRanges || []} />

                <div className="pt-4 border-t">
                    <button type="submit" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded">Guardar Configuración de Bloqueos</button>
                </div>
            </div>
        </form>
    )
}
