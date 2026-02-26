import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, Shield, User, Clock, Calendar } from "lucide-react"
import { DashboardCalendarWrapper } from '@/components/shared/dashboard-calendar-wrapper'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { ActivityFeed } from '@/components/user/activity-feed'
import { es } from 'date-fns/locale'
import { NoticeBoard } from '@/components/board/notice-board'

export default async function UserDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: approvedRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')

    // Fetch latest 5 requests for activity feed
    const { data: recentRequests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch latest 5 messages for activity feed
    const { data: recentMessages } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Normalize activities
    const activities: any[] = [
        ...(recentRequests?.map(r => ({
            id: r.id,
            type: 'request' as const,
            title: `Solicitud de ${r.type}`,
            subtitle: `${r.start_date} - ${r.end_date}`,
            status: r.status,
            date: new Date(r.created_at)
        })) || []),
        ...(recentMessages?.map(m => ({
            id: m.id,
            type: 'message' as const,
            title: `Mensaje de ${(m.sender as any)?.full_name || 'Admin'}`,
            subtitle: 'Mensaje recibido de administración',
            content: m.content,
            date: new Date(m.created_at)
        })) || [])
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6)

    // Fetch availability for current month
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(today)

    const { data: availability } = await supabase
        .from('daily_availability')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))

    // Helper to calculate days for a set of requests
    const calculateDays = (type: 'PO' | 'DA' | 'AP', filter: 'consumed' | 'scheduled') => {
        if (!approvedRequests) return 0
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        return approvedRequests
            .filter(r => r.type === type)
            .filter(r => {
                const startDate = new Date(r.start_date)
                if (filter === 'consumed') return startDate < now
                if (filter === 'scheduled') return startDate >= now
                return false
            })
            .reduce((acc, r) => {
                const start = new Date(r.start_date)
                const end = new Date(r.end_date)
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return acc + diffDays
            }, 0)
    }

    const balances = {
        PO: {
            total: profile?.balance_po || 0,
            consumed: calculateDays('PO', 'consumed'),
            scheduled: calculateDays('PO', 'scheduled')
        },
        DA: {
            total: profile?.balance_da || 0,
            consumed: calculateDays('DA', 'consumed'),
            scheduled: calculateDays('DA', 'scheduled')
        },
        AP: {
            total: profile?.balance_ap || 0,
            consumed: calculateDays('AP', 'consumed'),
            scheduled: calculateDays('AP', 'scheduled')
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-primary">Mis Saldos Disponibles</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Permiso Oficial (PO)
                        </CardTitle>
                        <Shield className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {balances.PO.total - balances.PO.consumed - balances.PO.scheduled}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter mt-1">días disponibles de {balances.PO.total}</p>
                        <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Consumidos: {balances.PO.consumed}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Agendados: {balances.PO.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Días Adicionales (DA)
                        </CardTitle>
                        <CalendarCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {balances.DA.total - balances.DA.consumed - balances.DA.scheduled}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter mt-1">días disponibles de {balances.DA.total}</p>
                        <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Consumidos: {balances.DA.consumed}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Agendados: {balances.DA.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Asuntos Propios (AP)
                        </CardTitle>
                        <User className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {balances.AP.total - balances.AP.consumed - balances.AP.scheduled}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter mt-1">días disponibles de {balances.AP.total}</p>
                        <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Consumidos: {balances.AP.consumed}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Agendados: {balances.AP.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-primary" />
                            Disponibilidad de Ausencias
                        </h2>
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-base font-bold">Días Libres ({format(today, 'MMMM', { locale: es })})</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <DashboardCalendarWrapper
                                    initialMonth={today}
                                    initialAvailability={availability || []}
                                    mode="user"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Actividad Reciente
                        </h2>
                        <ActivityFeed activities={activities} />
                    </div>
                </div>

                <div className="lg:border-l lg:pl-6 border-border/50">
                    <NoticeBoard />
                </div>
            </div>
        </div>
    )
}
