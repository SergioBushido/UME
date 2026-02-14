'use client'

import React from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { cn } from '@/lib/utils'

export type DailyAvailability = {
  date: string
  total_staff: number
  min_required: number
  max_absence: number
  approved_count: number
  is_locked: boolean
}

interface AvailabilityCalendarProps {
  month: Date
  availability: DailyAvailability[]
  mode?: 'admin' | 'user'
  onDayClick?: (date: Date) => void
}

export function AvailabilityCalendar({
  month,
  availability,
  mode = 'admin',
  onDayClick,
}: AvailabilityCalendarProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="space-y-4">
      <div className="hidden sm:grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((d) => (
          <div key={d} className="font-semibold text-muted-foreground text-sm py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px] grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const data = availability.find((a) => a.date === dateStr)
            const isCurrentMonth = isSameMonth(day, month)

            const total = data?.total_staff ?? 0
            const max = data?.max_absence ?? 0
            const approved = data?.approved_count ?? 0
            const remaining = max - approved
            const blocked = !!data?.is_locked
            const pct = max ? Math.min(100, Math.round((approved / max) * 100)) : 0

            let bgClass = 'bg-background'
            if (blocked) bgClass = 'bg-gray-100 dark:bg-gray-800'
            else if (data) {
              if (remaining <= 0) bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200'
              else if (remaining <= 1) bgClass = 'bg-orange-50 dark:bg-orange-900/20 border-orange-200'
              else bgClass = 'bg-green-50 dark:bg-green-900/20 border-green-200'
            } else if (!isCurrentMonth) bgClass = 'bg-muted/30'

            return (
              <div
                key={dateStr}
                onClick={() => mode === 'admin' && onDayClick && onDayClick(day)}
                className={cn(
                  'min-h-[64px] sm:min-h-[80px] p-2 sm:p-2 border rounded-md flex flex-col justify-between text-sm transition-all relative',
                  bgClass,
                  !isCurrentMonth && 'opacity-50'
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn('font-medium', isToday(day) && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center -ml-1 -mt-1 text-xs')}>
                    {format(day, 'd')}
                  </span>
                  {blocked && <span className="text-[10px] bg-gray-500 text-white px-1 rounded">CERRADO</span>}
                </div>

                {data && !blocked && total > 0 ? (
                  <div className="space-y-1 mt-1 text-xs">
                    {mode === 'admin' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plantilla:</span>
                          <span>{total}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Cupo:</span>
                          <span className={remaining <= 0 ? 'text-red-500' : 'text-green-600'}>
                            {approved} / {max}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                          <div className={cn('h-1.5 rounded-full', remaining <= 0 ? 'bg-red-500' : 'bg-green-500')} style={{ width: pct + '%' }} />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full pt-1">
                        <span className={cn('font-bold text-lg', remaining <= 0 ? 'text-red-500' : 'text-green-600')}>{remaining <= 0 ? '0' : remaining}</span>
                        <span className="text-[10px] text-muted-foreground">libres</span>
                      </div>
                    )}
                  </div>
                ) : (
                  isCurrentMonth && (
                    <div className="text-[10px] text-muted-foreground text-center mt-4">{mode === 'admin' ? 'Sin config' : '-'}</div>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
