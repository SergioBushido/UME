import { createClient } from '@/lib/supabase/server'
import { AvailabilityCalendar } from '@/components/shared/availability-calendar'
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { redirect } from 'next/navigation'

export default async function UserCalendarPage({
    searchParams,
}: {
    searchParams: { month?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

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
                    <h2 className="text-3xl font-bold tracking-tight">Calendario de Disponibilidad</h2>
                    <p className="text-muted-foreground">Consulta los días libres para solicitar vacaciones.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/user/calendar?month=${prevMonth}`}>
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="font-medium min-w-[150px] text-center">
                        {format(monthDate, 'MMMM yyyy')}
                    </div>
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/user/calendar?month=${nextMonth}`}>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-4">
                <AvailabilityCalendar
                    month={monthDate}
                    availability={availability || []}
                    mode="user"
                />
            </div>
        </div>
    )
}
