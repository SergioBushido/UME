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
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { EditUserDialog } from './edit-user-dialog'
import { CreateUserDialog } from './create-user-dialog'
import { Trash } from "lucide-react"
import { deleteUser } from './actions'
import Link from 'next/link'

export default async function UsersPage() {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            *,
            requests (
                type,
                start_date,
                end_date,
                status
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error loading users</div>
    }

    const calculateStats = (requests: any[], type: string, total: number) => {
        if (!requests) return { available: total, consumed: 0, scheduled: 0 }

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const approved = requests.filter((r: any) => r.type === type && r.status === 'approved')

        let consumed = 0
        let scheduled = 0

        approved.forEach((r: any) => {
            const start = new Date(r.start_date)
            const end = new Date(r.end_date)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

            if (start < now) {
                consumed += diffDays
            } else {
                scheduled += diffDays
            }
        })

        return {
            available: total - consumed - scheduled,
            consumed,
            scheduled
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
                    <p className="text-muted-foreground">Gestiona el personal y sus saldos de días.</p>
                </div>
                <CreateUserDialog />
            </div>

            <div className="border rounded-lg bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Sección</TableHead>
                            <TableHead className="text-center">PO (Disp/Tot)</TableHead>
                            <TableHead className="text-center">DA (Disp/Tot)</TableHead>
                            <TableHead className="text-center">AP (Disp/Tot)</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.map((profile) => {
                            const po = calculateStats(profile.requests, 'PO', profile.balance_po || 0)
                            const da = calculateStats(profile.requests, 'DA', profile.balance_da || 0)
                            const ap = calculateStats(profile.requests, 'AP', profile.balance_ap || 0)

                            return (

                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/users/${profile.id}`} className="hover:underline text-primary">
                                            {profile.full_name || 'Sin nombre'}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{profile.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                                            {profile.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{profile.section || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-green-600">{po.available}</span>
                                            <span className="text-xs text-muted-foreground">de {profile.balance_po}</span>
                                            {(po.consumed > 0 || po.scheduled > 0) && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    C:{po.consumed} / A:{po.scheduled}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-green-600">{da.available}</span>
                                            <span className="text-xs text-muted-foreground">de {profile.balance_da}</span>
                                            {(da.consumed > 0 || da.scheduled > 0) && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    C:{da.consumed} / A:{da.scheduled}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-green-600">{ap.available}</span>
                                            <span className="text-xs text-muted-foreground">de {profile.balance_ap}</span>
                                            {(ap.consumed > 0 || ap.scheduled > 0) && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    C:{ap.consumed} / A:{ap.scheduled}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <EditUserDialog user={profile} />
                                            <form action={async () => {
                                                'use server'
                                                await deleteUser(profile.id)
                                            }}>
                                                <Button size="sm" variant="destructive" type="submit">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {profiles?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No hay usuarios registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
