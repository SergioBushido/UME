'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'

export function ForceSyncButton() {
  const [loading, setLoading] = useState(false)
  const { show } = useToast()
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (loading) return
    setOpen(true)
  }

  const handleConfirm = async () => {
    setOpen(false)
    setLoading(true)
    try {
      const res = await fetch('/admin/capacity/force-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error syncing')
      show({ title: 'Sincronización completa', type: 'success' })
    } catch (err: any) {
      show({ title: 'Error al sincronizar', description: err?.message || String(err), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleClick} disabled={loading} size="sm" variant="ghost">
        {loading ? 'Sincronizando...' : 'Forzar sincronización'}
      </Button>
      <ConfirmModal
        open={open}
        title="Forzar sincronización"
        description="Esta acción regenerará la disponibilidad para el periodo configurado. ¿Deseas continuar?"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
