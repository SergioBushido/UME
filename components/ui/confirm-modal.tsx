'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function ConfirmModal({ open, title, description, onConfirm, onCancel }: {
  open: boolean
  title: string
  description?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
        </DialogHeader>
        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={loading}>{loading ? '...' : 'Confirmar'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
