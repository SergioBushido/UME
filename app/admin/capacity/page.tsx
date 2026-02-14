import { createClient } from '@/lib/supabase/server'
// import { getDailyAvailability } from '../settings/capacity-actions'
import { DashboardCalendarWrapper } from '@/components/shared/dashboard-calendar-wrapper'
import { endOfMonth, format, startOfMonth } from 'date-fns'
// import { Button } from "@/components/ui/button"
// import Link from 'next/link'
// import { ChevronLeft, ChevronRight } from "lucide-react"

export default async function CapacityPage({
    searchParams,
}: {
    searchParams: { month?: string }
}) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>No autorizado</div>

    // Determine date range
    const today = new Date()
    const currentMonth = searchParams.month ? new Date(searchParams.month) : startOfMonth(today)

    // Validate date
    const monthDate = isNaN(currentMonth.getTime()) ? startOfMonth(today) : currentMonth

    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)

    // Fetch data
    const { data: availability } = await supabase
        .from('daily_availability')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))

    const prevMonth = format(subMonths(monthDate, 1), 'yyyy-MM-dd')
    const nextMonth = format(addMonths(monthDate, 1), 'yyyy-MM-dd')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Calendario de Capacidad</h2>
                    <p className="text-muted-foreground">Visualiza la disponibilidad diaria y el cumplimiento de presencias.</p>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-4">
                <DashboardCalendarWrapper
                    initialMonth={monthDate}
                    initialAvailability={availability || []}
                    mode="admin"
                />
            </div>
        </div>
    )
}
