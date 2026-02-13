import CalendarView from '@/components/shared/calendar-view'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateEventDialog } from './create-event-dialog'

export default async function AdminCalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch users for the dialog
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').order('full_name')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Calendario de Turnos</h2>
                    <p className="text-muted-foreground">Vista global de ausencias y eventos especiales.</p>
                </div>
                <CreateEventDialog users={profiles || []} />
            </div>

            <div className="mt-6">
                <CalendarView />
            </div>
        </div>
    )
}
