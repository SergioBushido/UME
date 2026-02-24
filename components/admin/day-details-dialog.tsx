'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// import { ScrollArea } from "@/components/ui/scroll-area" // Not installed
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Trash2, UserX, Pencil } from "lucide-react"
import { useState, useTransition } from "react"
import { revokeRequest } from "@/app/admin/capacity/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

interface DayDetailsProps {
    date: Date | null
    isOpen: boolean
    onClose: () => void
    data: any // The result from getDayDetails
    isLoading: boolean
    onUpdate: () => void
}

export function DayDetailsDialog({ date, isOpen, onClose, data, isLoading, onUpdate }: DayDetailsProps) {

    const [isPending, startTransition] = useTransition()
    const [isAdding, setIsAdding] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState('')
    const [selectedType, setSelectedType] = useState('PO')

    // Date Range State
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null)

    // Fetch users helper
    const ensureUsersLoaded = () => {
        if (users.length === 0) {
            import('@/app/admin/capacity/manual-absence-action').then(async (mod) => {
                const u = await mod.getUsers()
                setUsers(u)
            })
        }
    }

    // Start Add
    const handleStartAdd = () => {
        setEditingId(null)
        setSelectedUser('')
        setSelectedType('PO')
        // Default to selected date
        if (date) {
            const d = format(date, 'yyyy-MM-dd')
            setStartDate(d)
            setEndDate(d)
        }
        setIsAdding(true)
        ensureUsersLoaded()
    }

    // Start Edit
    const handleStartEdit = (req: any) => {
        setEditingId(req.id)
        setSelectedUser(req.user_id)
        setSelectedType(req.type)
        setStartDate(req.start_date)
        setEndDate(req.end_date)
        setIsAdding(true) // Reuse the form container
        ensureUsersLoaded()
    }

    const handleCancelForm = () => {
        setIsAdding(false)
        setEditingId(null)
        setSelectedUser('')
        setSelectedType('PO')
        setStartDate('')
        setEndDate('')
    }

    const handleSubmit = async () => {
        if (!selectedUser || !startDate || !endDate) return
        startTransition(async () => {
            try {
                // Import dynamically
                const actions = await import('@/app/admin/capacity/manual-absence-action')

                if (editingId) {
                    await actions.updateAbsence(editingId, {
                        userId: selectedUser,
                        type: selectedType as any,
                        startDate,
                        endDate
                    })
                } else {
                    await actions.createAndApproveAbsence(selectedUser, selectedType as any, startDate, endDate)
                }

                onUpdate()
                handleCancelForm()
                toast.success(editingId ? "Ausencia actualizada correctamente." : "Ausencia creada correctamente.", {
                    description: "Operación exitosa"
                })
            } catch (error: any) {
                console.error(error)
                toast.error(error.message || "Ha ocurrido un error.", {
                    description: "Error"
                })
            }
        })
    }

    // Handle Revoke
    const handleRevoke = (requestId: string) => {
        if (!confirm("¿Estás seguro de que quieres cancelar esta solicitud? Se devolverán los días al usuario.")) return

        startTransition(async () => {
            try {
                await revokeRequest(requestId, '/admin/capacity') // Revalidate general path
                onUpdate() // Refresh local data
                toast.success("La solicitud ha sido cancelada correctamente.", {
                    description: "Solicitud cancelada"
                })
            } catch (error) {
                console.error(error)
                toast.error("No se pudo cancelar la solicitud.", {
                    description: "Error"
                })
            }
        })
    }

    const { capacity, requests, events, allProfiles } = data || {}
    const total = capacity?.total_staff || 0
    const max = capacity?.max_absence || 0
    const approved = capacity?.approved_count || 0

    // Calculate present personnel
    const absentIds = new Set((requests || []).filter((r: any) => r.status !== 'rejected').map((r: any) => r.user_id))
    const presentProfiles = (allProfiles || []).filter((p: any) => !absentIds.has(p.id))

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>
                            {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : 'Selecciona una fecha'}
                        </DialogTitle>
                        <DialogDescription>
                            Administrar presencia y ausencias del personal.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="bg-muted p-2 rounded border border-border/50 shadow-sm">
                                <span className="block text-muted-foreground text-[10px] uppercase font-bold tracking-tight">Plantilla</span>
                                <span className="font-bold text-lg">{allProfiles?.length || total}</span>
                            </div>
                            <div className="bg-muted p-2 rounded border border-border/50 shadow-sm">
                                <span className="block text-muted-foreground text-[10px] uppercase font-bold tracking-tight">Cupo Máx</span>
                                <span className="font-bold text-lg">{max}</span>
                            </div>
                            <div className={cn(
                                "p-2 rounded border shadow-sm transition-colors",
                                approved > max ? "bg-red-500/10 text-red-600 border-red-200" : "bg-green-500/10 text-green-600 border-green-200"
                            )}>
                                <span className="block text-[10px] uppercase font-bold tracking-tight opacity-80">Ausentes</span>
                                <span className="font-bold text-lg">{approved}</span>
                            </div>
                        </div>

                        {isAdding ? (
                            <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-primary/20 shadow-inner">
                                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                                    <Pencil className="h-4 w-4" />
                                    {editingId ? 'Editar Ausencia' : 'Añadir Ausencia Manual'}
                                </h4>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Personal</label>
                                    <select
                                        className="w-full text-sm border rounded-lg p-2.5 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={selectedUser}
                                        onChange={e => setSelectedUser(e.target.value)}
                                        disabled={!!editingId}
                                    >
                                        <option value="">Seleccionar empleado...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Tipo de Ausencia</label>
                                    <select
                                        className="w-full text-sm border rounded-lg p-2.5 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={selectedType}
                                        onChange={e => setSelectedType(e.target.value)}
                                    >
                                        <option value="PO">Permiso Oficial (PO)</option>
                                        <option value="DA">Días Adicionales (DA)</option>
                                        <option value="AP">Asuntos Propios (AP)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Desde</label>
                                        <input
                                            type="date"
                                            className="w-full text-sm border rounded-lg p-2.5 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Hasta</label>
                                        <input
                                            type="date"
                                            className="w-full text-sm border rounded-lg p-2.5 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancelForm} className="rounded-full">Cancelar</Button>
                                    <Button size="sm" onClick={handleSubmit} disabled={isPending || !selectedUser} className="rounded-full px-6">
                                        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        {editingId ? 'Actualizar' : 'Guardar'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button className="w-full rounded-xl border-dashed py-6 group hover:border-primary transition-all" variant="outline" onClick={handleStartAdd}>
                                <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                                    <span className="text-lg">+</span>
                                    <span className="font-bold">Registrar Ausencia Manual</span>
                                </div>
                            </Button>
                        )}

                        {/* Absent List */}
                        <div className="space-y-3">
                            <h4 className="font-black text-xs uppercase tracking-widest text-red-600 flex items-center gap-2 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                                Personal Ausente
                            </h4>
                            <div className="space-y-2">
                                {requests?.length === 0 ? (
                                    <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border/50">
                                        <p className="text-xs text-muted-foreground italic">No hay ausencias para hoy.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {(requests || []).slice().sort((a: any, b: any) => {
                                            const score = (s: string) => (s === 'approved' ? 0 : s === 'pending' ? 1 : 2)
                                            return score(a.status) - score(b.status)
                                        }).map((req: any) => (
                                            <div key={req.id} className="flex items-center justify-between p-3 bg-card border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm group hover:shadow-md transition-all">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm truncate">{req.profiles?.full_name}</p>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] px-1.5 py-0 rounded-full font-bold uppercase tracking-tighter transition-colors",
                                                            req.status === 'approved' ? "text-green-600 border-green-200 bg-green-50" : "text-amber-600 border-amber-200 bg-amber-50"
                                                        )}>
                                                            {req.type} {req.status === 'approved' ? 'OK' : 'PND'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {format(new Date(req.start_date), 'd MMM')} - {format(new Date(req.end_date), 'd MMM')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 rounded-full" onClick={() => handleStartEdit(req)} disabled={isPending}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 rounded-full" onClick={() => handleRevoke(req.id)} disabled={isPending}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Present List */}
                        <div className="space-y-3">
                            <h4 className="font-black text-xs uppercase tracking-widest text-green-600 flex items-center gap-2 px-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                Personal Presente
                            </h4>
                            <div className="bg-muted/30 rounded-xl border border-border/50 p-1">
                                {presentProfiles.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4 italic">No hay personal disponible hoy.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-1">
                                        {presentProfiles.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-2.5 px-3 rounded-lg hover:bg-background transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                                        <Shield className="h-3 w-3 text-green-600" />
                                                    </div>
                                                    <span className="text-sm font-medium">{p.full_name}</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded tracking-tighter">
                                                    {p.section}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Event list as simple badge-like list if present */}
                        {events?.length > 0 && (
                            <div className="pt-2 border-t">
                                <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-2 px-1">Eventos del Día</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {events.map((evt: any) => (
                                        <div key={evt.id} className="text-[9px] bg-amber-500/10 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                                            {evt.profiles?.full_name}: {evt.type}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
