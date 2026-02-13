import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageForm } from './message-form'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch User Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) return <div>Usuario no encontrado</div>

    // Fetch Requests History
    const { data: requests } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

    // Fetch Messages
    const { data: messages } = await supabase
        .from('messages')
        .select(`
            *,
            sender:sender_id(full_name, role)
        `)
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
        .order('created_at', { ascending: true })

    // Calculate Stats (Reusing logic logic simplified)
    const calculateStats = (type: string, total: number) => {
        if (!requests) return { available: total, consumed: 0, scheduled: 0 }
        const approved = requests.filter((r: any) => r.type === type && r.status === 'approved')

        let consumed = 0
        let scheduled = 0
        const now = new Date()

        approved.forEach((r: any) => {
            const start = new Date(r.start_date)
            const end = new Date(r.end_date)
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            if (start < now) consumed += diffDays
            else scheduled += diffDays
        })

        return { available: total - consumed - scheduled, consumed, scheduled }
    }

    const po = calculateStats('PO', profile.balance_po || 0)
    const da = calculateStats('DA', profile.balance_da || 0)
    const ap = calculateStats('AP', profile.balance_ap || 0)

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{profile.full_name || 'Sin Nombre'}</h2>
                <p className="text-muted-foreground">{profile.email} • {profile.section} • {profile.role}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Permiso Oficial (PO)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{po.available} dias</div>
                        <p className="text-xs text-muted-foreground">de {profile.balance_po} asignados</p>
                        <div className="mt-2 text-xs flex gap-2">
                            <span>Consumidos: {po.consumed}</span>
                            <span>Agendados: {po.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Días Asuntos (DA)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{da.available} dias</div>
                        <p className="text-xs text-muted-foreground">de {profile.balance_da} asignados</p>
                        <div className="mt-2 text-xs flex gap-2">
                            <span>Consumidos: {da.consumed}</span>
                            <span>Agendados: {da.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Asuntos Particulares (AP)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{ap.available} dias</div>
                        <p className="text-xs text-muted-foreground">de {profile.balance_ap} asignados</p>
                        <div className="mt-2 text-xs flex gap-2">
                            <span>Consumidos: {ap.consumed}</span>
                            <span>Agendados: {ap.scheduled}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs content */}
            <Tabs defaultValue="history" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="history">Historial de Solicitudes</TabsTrigger>
                    <TabsTrigger value="messages">Mensajes</TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial</CardTitle>
                            <CardDescription>Todas las solicitudes pasadas y futuras.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {requests?.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-semibold">{req.type}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(req.start_date), 'P', { locale: es })} - {format(new Date(req.end_date), 'P', { locale: es })}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant={
                                                req.status === 'approved' ? 'default' :
                                                    req.status === 'rejected' ? 'destructive' : 'secondary'
                                            }>
                                                {req.status === 'approved' ? 'Aprobado' :
                                                    req.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Solicitado el {format(new Date(req.created_at), 'P', { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {requests?.length === 0 && <p className="text-muted-foreground text-center py-4">No hay historial.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages">
                    <Card className="flex flex-col h-[600px]">
                        <CardHeader>
                            <CardTitle>Chat con {profile.full_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-md border bg-muted/20">
                                {messages?.map((msg) => {
                                    const isMe = msg.sender_id !== id // If sender is NOT the user page I'm viewing, it's me (Admin)
                                    // Actually, if I am admin, msg.sender_id === my_id. 
                                    // Logic: The page is for User X (id).
                                    // If msg.sender_id === id, then it was sent BY USER X -> received by me.
                                    // If msg.sender_id !== id, then it was sent BY ME (or another admin) -> to User X.

                                    // Let's rely on checking if sender_id === profile.id
                                    const sentByUser = msg.sender_id === profile.id

                                    return (
                                        <div key={msg.id} className={`flex flex-col ${sentByUser ? 'items-start' : 'items-end'}`}>
                                            <div className={`max-w-[80%] rounded-lg p-3 ${sentByUser ? 'bg-muted' : 'bg-primary text-primary-foreground'
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1">
                                                {format(new Date(msg.created_at), 'Pp', { locale: es })}
                                            </span>
                                        </div>
                                    )
                                })}
                                {messages?.length === 0 && (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No hay mensajes. Escribe el primero.
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="pt-2">
                                <MessageForm receiverId={id} />
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
