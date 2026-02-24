'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from '@/lib/supabase/client'
import { User, Calendar as CalendarIcon, Shield, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { DayDetailsDialog } from '@/components/admin/day-details-dialog'
import { getDayDetails } from '@/app/admin/capacity/actions'
import { format as formatBtn } from 'date-fns'
import { cn } from '@/lib/utils'

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

    // Dialog State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dayDetails, setDayDetails] = useState<any>(null)
    const [isDetailsLoading, setIsDetailsLoading] = useState(false)

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

    const handleDayClick = async (day: Date) => {
        setSelectedDate(day)
        setIsDialogOpen(true)
        setIsDetailsLoading(true)

        try {
            const details = await getDayDetails(formatBtn(day, 'yyyy-MM-dd'))
            setDayDetails(details)
        } catch (e) {
            console.error(e)
            setDayDetails(null)
        } finally {
            setIsDetailsLoading(false)
        }
    }

    const updateDayDetails = async () => {
        if (!selectedDate) return
        setIsDetailsLoading(true)
        try {
            const details = await getDayDetails(formatBtn(selectedDate, 'yyyy-MM-dd'))
            setDayDetails(details)
            // Also refresh main calendar data
            // (In a real app we might want to refetch all events here)
        } finally {
            setIsDetailsLoading(false)
        }
    }

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
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <CardTitle>{monthNames[currentMonth]} {currentYear}</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDate(new Date(currentYear, currentMonth - 1, 1))}>&lt;</Button>
                    <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Hoy</Button>
                    <Button variant="outline" size="sm" onClick={() => setDate(new Date(currentYear, currentMonth + 1, 1))}>&gt;</Button>
                </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
                <div className="overflow-x-visible">
                    <div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center font-bold text-muted-foreground text-[10px] sm:text-base">
                            <div>Dom</div><div>Lun</div><div>Mar</div><div>Mie</div><div>Jue</div><div>Vie</div><div>Sab</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {blanks.map((_, i) => <div key={`blank-${i}`} className="h-16 sm:h-32 bg-muted/10 rounded-md"></div>)}
                            {days.map(d => {
                                const dayDate = new Date(currentYear, currentMonth, d)
                                const dayEvents = getEventsForDate(dayDate)

                                return (
                                    <div
                                        key={d}
                                        onClick={() => handleDayClick(dayDate)}
                                        className="h-20 sm:h-32 border border-border rounded-md p-1 overflow-y-auto bg-card hover:bg-accent/50 cursor-pointer transition-all relative flex flex-col group"
                                    >
                                        <span className="font-bold text-[10px] sm:text-sm text-muted-foreground block mb-1 sticky top-0 bg-card/80 backdrop-blur-sm z-10 group-hover:text-primary transition-colors">{d}</span>
                                        <div className="space-y-0.5 sm:space-y-1 flex-1">
                                            {dayEvents.map((evt, idx) => (
                                                <div
                                                    key={`${evt.id}-${idx}`}
                                                    className={`text-[8px] sm:text-[10px] p-0.5 sm:p-1 rounded truncate font-medium border leading-tight
                                                        ${evt.status === 'pending' ? 'opacity-70 border-dashed' : ''}
                                                        ${evt.type === 'PO' ? 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-100 dark:border-blue-800' : ''}
                                                        ${evt.type === 'DA' ? 'bg-purple-100/50 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-100 dark:border-purple-800' : ''}
                                                        ${evt.type === 'AP' ? 'bg-indigo-100/50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-100 dark:border-indigo-800' : ''}
                                                        ${['guardia', 'curso'].includes(evt.type) ? 'bg-orange-100/50 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-100 dark:border-orange-800' : ''}
                                                    `}
                                                    title={`${evt.userName} - ${evt.type} ${evt.status ? `(${evt.status})` : ''}`}
                                                >
                                                    <span className="hidden sm:inline">{evt.userName.split(' ')[0]} - </span> {evt.type}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <DayDetailsDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    date={selectedDate}
                    data={dayDetails}
                    isLoading={isDetailsLoading}
                    onUpdate={updateDayDetails}
                />
            </CardContent>
        </Card>
    )
}
