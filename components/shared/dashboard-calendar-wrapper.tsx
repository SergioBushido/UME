'use client'

import { useState, useCallback, useEffect } from 'react'
import { AvailabilityCalendar, DailyAvailability } from '@/components/shared/availability-calendar'
import { addMonths, format, subMonths } from 'date-fns'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getDailyAvailability } from '@/app/admin/settings/capacity-actions'
import { getDayDetails } from '@/app/admin/capacity/actions'
import { DayDetailsDialog } from '@/components/admin/day-details-dialog'

interface DashboardCalendarWrapperProps {
    initialMonth: Date
    initialAvailability: DailyAvailability[]
    mode?: 'admin' | 'user'
}

export function DashboardCalendarWrapper({
    initialMonth,
    initialAvailability,
    mode = 'admin'
}: DashboardCalendarWrapperProps) {
    const [currentMonth, setCurrentMonth] = useState(initialMonth)
    const [availability, setAvailability] = useState(initialAvailability)
    const [isLoading, setIsLoading] = useState(false)

    // Dialog State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dayDetails, setDayDetails] = useState<any>(null)
    const [isDetailsLoading, setIsDetailsLoading] = useState(false)

    const fetchAvailability = useCallback(async (date: Date) => {
        setIsLoading(true)
        try {
            const start = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd')
            const end = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd')

            // Re-using the server action
            const { data } = await getDailyAvailability(start, end)
            // Need to map the data to match DailyAvailability type if needed, 
            // but the types should match since we defined them similarly.
            // However, getDailyAvailability returns the raw DB rows.
            // AvailabilityCalendar expects DailyAvailability.
            // Let's ensure type compatibility.
            // @ts-ignore
            setAvailability(data || [])
        } catch (error) {
            console.error("Error fetching availability:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handlePrevMonth = () => {
        const newMonth = subMonths(currentMonth, 1)
        setCurrentMonth(newMonth)
        fetchAvailability(newMonth)
    }

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1)
        setCurrentMonth(newMonth)
        fetchAvailability(newMonth)
    }

    const handleDayClick = async (date: Date) => {
        if (mode !== 'admin') return

        setSelectedDate(date)
        setIsDialogOpen(true)
        setIsDetailsLoading(true)

        try {
            const details = await getDayDetails(format(date, 'yyyy-MM-dd'))
            setDayDetails(details)
        } catch (e) {
            console.error(e)
            setDayDetails(null)
        } finally {
            setIsDetailsLoading(false)
        }
    }

    // Function to reload detailed data after a change
    const updateDayDetails = async () => {
        if (!selectedDate) return
        setIsDetailsLoading(true)
        try {
            const details = await getDayDetails(format(selectedDate, 'yyyy-MM-dd'))
            setDayDetails(details)
            // Also refresh main calendar data
            fetchAvailability(currentMonth)
        } finally {
            setIsDetailsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isLoading}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium min-w-[150px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                </div>
                <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isLoading}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <AvailabilityCalendar
                    month={currentMonth}
                    availability={availability}
                    mode={mode}
                    onDayClick={handleDayClick}
                />
            </div>

            {mode === 'admin' && (
                <DayDetailsDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    date={selectedDate}
                    data={dayDetails}
                    isLoading={isDetailsLoading}
                    onUpdate={updateDayDetails}
                />
            )}
        </div>
    )
}
