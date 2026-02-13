import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, AlertCircle } from "lucide-react"
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Fetch stats
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: pendingRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: todayEvents } = await supabase.from('special_events').select('*', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Panel de Control</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/admin/users">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Usuarios
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userCount || 0}</div>
                            <p className="text-xs text-muted-foreground">personal registrado</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/requests">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Solicitudes Pendientes
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingRequests || 0}</div>
                            <p className="text-xs text-muted-foreground">requieren atención</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/calendar">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Eventos Hoy
                            </CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{todayEvents || 0}</div>
                            <p className="text-xs text-muted-foreground">guardias o cursos activos</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
