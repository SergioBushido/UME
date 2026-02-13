import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, Shield, User } from "lucide-react"

export default async function UserDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: requests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')

    // Helper to calculate days for a set of requests
    const calculateDays = (type: 'PO' | 'DA' | 'AP', filter: 'consumed' | 'scheduled') => {
        if (!requests) return 0
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        return requests
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
            <h1 className="text-2xl font-bold">Mis Saldos Disponibles</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Permiso Oficial (PO)
                        </CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balances.PO.total - balances.PO.consumed - balances.PO.scheduled}
                        </div>
                        <p className="text-xs text-muted-foreground">días disponibles de {balances.PO.total}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                            <span>Consumidos: {balances.PO.consumed}</span>
                            <span>Agendados: {balances.PO.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Días Adicionales (DA)
                        </CardTitle>
                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balances.DA.total - balances.DA.consumed - balances.DA.scheduled}
                        </div>
                        <p className="text-xs text-muted-foreground">días disponibles de {balances.DA.total}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                            <span>Consumidos: {balances.DA.consumed}</span>
                            <span>Agendados: {balances.DA.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Asuntos Propios (AP)
                        </CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balances.AP.total - balances.AP.consumed - balances.AP.scheduled}
                        </div>
                        <p className="text-xs text-muted-foreground">días disponibles de {balances.AP.total}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                            <span>Consumidos: {balances.AP.consumed}</span>
                            <span>Agendados: {balances.AP.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
                <div className="bg-card p-6 rounded-lg shadow text-center text-muted-foreground border border-border">
                    No hay actividad reciente para mostrar.
                </div>
            </div>
        </div>
    )
}
