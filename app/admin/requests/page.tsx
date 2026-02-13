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
import { RequestActions } from './request-actions'

export default async function RequestsPage() {
    const supabase = await createClient()

    const { data: requests, error } = await supabase
        .from('requests')
        .select(`
      *,
      profiles (full_name, email)
    `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    if (error) {
        return <div>Error loading requests</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Solicitudes Pendientes</h2>
                <p className="text-muted-foreground">Gestiona las solicitudes de ausencia.</p>
            </div>

            <div className="border rounded-lg bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Desde</TableHead>
                            <TableHead>Hasta</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests?.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">
                                    {request.profiles?.full_name || request.profiles?.email}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{request.type}</Badge>
                                </TableCell>
                                <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge className="bg-yellow-500">{request.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RequestActions request={request} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {requests?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay solicitudes pendientes.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
