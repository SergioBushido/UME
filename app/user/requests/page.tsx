import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function RequestHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: requests, error } = await supabase
        .from('requests')
        .select(`*`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error loading requests</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Historial de Solicitudes</h2>
                <p className="text-muted-foreground">Consulta el estado de tus peticiones.</p>
            </div>

            <div className="border rounded-lg bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Desde</TableHead>
                            <TableHead>Hasta</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Motivo (si rechazado)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests?.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>
                                    <Badge variant="outline">{request.type}</Badge>
                                </TableCell>
                                <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge className={
                                        request.status === 'approved' ? 'bg-green-600' :
                                            request.status === 'rejected' ? 'bg-red-600' :
                                                'bg-yellow-500'
                                    }>
                                        {request.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {request.rejection_reason || '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {requests?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No tienes solicitudes registradas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
