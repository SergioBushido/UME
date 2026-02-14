'use client'

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Toast = {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

const ToastContext = createContext<{ show: (t: Omit<Toast, 'id'>) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    const toast: Toast = { id, duration: 4000, ...t }
    setToasts((s) => [...s, toast])
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts((s) => s.filter(x => x.id !== id))
      }, toast.duration)
    }
  }, [])

  const value = { show }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            'max-w-sm w-full p-3 rounded-md shadow-lg border flex flex-col toast-enter',
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-800'
          )}>
            <div className="font-semibold">{t.title}</div>
            {t.description && <div className="text-sm mt-1">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
