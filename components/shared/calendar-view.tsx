'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from '@/lib/supabase/client'
import { User, Calendar as CalendarIcon, Shield, AlertCircle } from 'lucide-react'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

interface CalendarEvent {
    id: string
    date: Date
    type: 'PO' | 'DA' | 'AP' | 'guardia' | 'curso' | 'pase_hora'
    status?: 'pending' | 'approved' | 'rejected'
    userId: string
    userName: string
    description?: string
}

export default function CalendarView() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvents = async () => {
            const supabase = createClient()

            // Fetch requests (absences)
            const { data: requests } = await supabase
                .from('requests')
                .select(`*, profiles(full_name)`)
                .neq('status', 'rejected')

            // Fetch special events (guards, etc)
            const { data: specialEvents } = await supabase
                .from('special_events')
                .select(`*, profiles(full_name)`)

            const allEvents: CalendarEvent[] = []

            // Process Requests (Date ranges expanded)
            requests?.forEach(req => {
                let current = new Date(req.start_date)
                const end = new Date(req.end_date)

                while (current <= end) {
                    allEvents.push({
                        id: req.id,
                        date: new Date(current),
                        type: req.type as any,
                        status: req.status as any,
                        userId: req.user_id,
                        // @ts-ignore
                        userName: req.profiles?.full_name || 'Desconocido',
                    })
                    current.setDate(current.getDate() + 1)
                }
            })

            // Process Special Events
            specialEvents?.forEach(evt => {
                allEvents.push({
                    id: evt.id,
                    date: new Date(evt.date),
                    type: evt.type as any,
                    userId: evt.user_id,
                    // @ts-ignore
                    userName: evt.profiles?.full_name || 'Desconocido',
                    description: evt.description
                })
            })

            setEvents(allEvents)
            setLoading(false)
        }

        fetchEvents()
    }, [])

    const getEventsForDate = (day: Date) => {
        return events.filter(e =>
            e.date.getDate() === day.getDate() &&
            e.date.getMonth() === day.getMonth() &&
            e.date.getFullYear() === day.getFullYear()
        )
    }

    // Custom day renderer logic could go here if using a more complex calendar lib,
    // but for shadcn calendar (react-day-picker), we can use modifiers or footer.
    // However, Shadcn's basic calendar is small. Let's make a custom month view manually
    // or use a larger calendar library?
    // The user requirement is "Calendario Visual (tipo FullCalendar o similar implementado con Shadcn)".
    // Shadcn uses react-day-picker which is great for date picking, not great for "Scheduler".
    // Let's implement a simple Month Grid using Tailwind CSS grid which is cleaner and more customizable.

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay() // 0 = Sun

    const currentYear = date?.getFullYear() || new Date().getFullYear()
    const currentMonth = date?.getMonth() || new Date().getMonth()

    const days = Array.from({ length: daysInMonth(currentYear, currentMonth) }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDayOfMonth(currentYear, currentMonth) }, (_, i) => i)

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{monthNames[currentMonth]} {currentYear}</CardTitle>
                <div className="flex gap-2">
                    <button onClick={() => setDate(new Date(currentYear, currentMonth - 1, 1))}>&lt;</button>
                    <button onClick={() => setDate(new Date())}>Hoy</button>
                    <button onClick={() => setDate(new Date(currentYear, currentMonth + 1, 1))}>&gt;</button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-2 text-center font-bold text-muted-foreground">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mie</div><div>Jue</div><div>Vie</div><div>Sab</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {blanks.map((_, i) => <div key={`blank-${i}`} className="h-32 bg-muted/20 rounded-md"></div>)}
                    {days.map(d => {
                        const dayDate = new Date(currentYear, currentMonth, d)
                        const dayEvents = getEventsForDate(dayDate)

                        return (
                            <div key={d} className="h-32 border border-border rounded-md p-1 overflow-y-auto bg-card hover:bg-accent/50 transition-colors relative">
                                <span className="font-semibold text-sm text-muted-foreground block mb-1 sticky top-0 bg-card z-10">{d}</span>
                                <div className="space-y-1">
                                    {dayEvents.map((evt, idx) => (
                                        <div
                                            key={`${evt.id}-${idx}`}
                                            className={`text-xs p-1 rounded truncate cursor-help font-medium border
                                                ${evt.status === 'pending' ? 'opacity-70 border-dashed' : ''}
                                                ${evt.type === 'PO' ? 'bg-blue-100/50 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-100 dark:border-blue-800' : ''}
                                                ${evt.type === 'DA' ? 'bg-purple-100/50 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-100 dark:border-purple-800' : ''}
                                                ${evt.type === 'AP' ? 'bg-indigo-100/50 text-indigo-700 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-100 dark:border-indigo-800' : ''}
                                                ${['guardia', 'curso'].includes(evt.type) ? 'bg-orange-100/50 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-100 dark:border-orange-800' : ''}
                                            `}
                                            title={`${evt.userName} - ${evt.type} ${evt.status ? `(${evt.status})` : ''}`}
                                        >
                                            {evt.userName.split(' ')[0]} - {evt.type} {evt.status === 'pending' ? '(P)' : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
