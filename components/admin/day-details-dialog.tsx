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

    const { capacity, requests, events } = data || {}
    const total = capacity?.total_staff || 0
    const max = capacity?.max_absence || 0
    const approved = capacity?.approved_count || 0

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {date ? format(date, "d 'de' MMMM, yyyy") : 'Selecciona una fecha'}
                    </DialogTitle>
                    <DialogDescription>
                        Administrar ausencias y capacidad.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="bg-muted p-2 rounded">
                                <span className="block text-muted-foreground text-xs">Plantilla</span>
                                <span className="font-bold">{total}</span>
                            </div>
                            <div className="bg-muted p-2 rounded">
                                <span className="block text-muted-foreground text-xs">Cupo Máx</span>
                                <span className="font-bold">{max}</span>
                            </div>
                            <div className={approved > max ? "bg-red-100 p-2 rounded text-red-700" : "bg-green-100 p-2 rounded text-green-700"}>
                                <span className="block text-xs opacity-80">Ocupado</span>
                                <span className="font-bold">{approved}</span>
                            </div>
                        </div>

                        {isAdding ? (
                            <div className="bg-muted/30 p-4 rounded-md space-y-3 border">
                                <h4 className="font-medium text-sm">
                                    {editingId ? 'Editar Ausencia' : 'Añadir Ausencia Manual'}
                                </h4>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Personal</label>
                                    <select
                                        className="w-full text-sm border rounded p-2 bg-background"
                                        value={selectedUser}
                                        onChange={e => setSelectedUser(e.target.value)}
                                        disabled={!!editingId} // Disable user change on edit
                                    >
                                        <option value="">Seleccionar empleado...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Tipo</label>
                                    <select
                                        className="w-full text-sm border rounded p-2 bg-background"
                                        value={selectedType}
                                        onChange={e => setSelectedType(e.target.value)}
                                    >
                                        <option value="PO">Permiso Oficial (PO)</option>
                                        <option value="DA">Días Adicionales (DA)</option>
                                        <option value="AP">Asuntos Propios (AP)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Desde</label>
                                        <input
                                            type="date"
                                            className="w-full text-sm border rounded p-2 bg-background"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium">Hasta</label>
                                        <input
                                            type="date"
                                            className="w-full text-sm border rounded p-2 bg-background"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancelForm}>Cancelar</Button>
                                    <Button size="sm" onClick={handleSubmit} disabled={isPending || !selectedUser}>
                                        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        {editingId ? 'Actualizar' : 'Guardar'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button className="w-full" variant="outline" onClick={handleStartAdd}>
                                + Incluir Personal
                            </Button>
                        )}

                        {/* Requests List */}
                        <div>
                            <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                                <UserX className="h-4 w-4" />
                                Personal Ausente
                            </h4>
                            <div className="h-[200px] border rounded-md p-2 overflow-y-auto">
                                {requests?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay ausencias aprobadas para este día.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {(() => {
                                            // Deduplicate by user_id: prefer approved over pending/rejected, show one entry per user
                                            const sorted = (requests || []).slice().sort((a: any, b: any) => {
                                                const score = (s: string) => (s === 'approved' ? 0 : s === 'pending' ? 1 : 2)
                                                const sa = score(a.status)
                                                const sb = score(b.status)
                                                if (sa !== sb) return sa - sb
                                                // fallback to created_at descending if present
                                                if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                                return 0
                                            })

                                            const map = new Map<string, any>()
                                            for (const req of sorted) {
                                                if (!map.has(req.user_id)) map.set(req.user_id, req)
                                            }

                                            return Array.from(map.values()).map((req: any) => (
                                                <li key={req.id} className="flex items-center justify-between text-sm p-2 bg-card border rounded shadow-sm">
                                                    <div>
                                                        <p className="font-medium">
                                                            {req.profiles?.full_name}
                                                            <span className={cn(
                                                                "ml-2 text-[10px] px-1.5 py-0.5 rounded-full border border-current",
                                                                req.status === 'approved' ? "text-green-600 bg-green-50 border-green-200" :
                                                                    req.status === 'pending' ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                                                                        "text-red-600 bg-red-50 border-red-200"
                                                            )}>
                                                                {req.status === 'approved' ? 'Aprobado' : req.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {req.type} • {format(new Date(req.start_date), 'd MMM')} - {format(new Date(req.end_date), 'd MMM')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleStartEdit(req)}
                                                            disabled={isPending}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRevoke(req.id)}
                                                            disabled={isPending}
                                                        >
                                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))
                                        })()}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Special Events List (ReadOnly) */}
                        {events?.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-sm">Eventos / Guardias</h4>
                                <ul className="text-sm space-y-1">
                                    {events.map((evt: any) => (
                                        <li key={evt.id} className="text-muted-foreground bg-muted/50 p-1 rounded px-2">
                                            {evt.profiles?.full_name} - {evt.type}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
