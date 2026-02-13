import CalendarView from '@/components/shared/calendar-view'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UserCalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Calendario</h2>
            <p className="text-muted-foreground">Consulta las guardias y ausencias del equipo.</p>

            <div className="mt-6">
                <CalendarView />
            </div>
        </div>
    )
}
