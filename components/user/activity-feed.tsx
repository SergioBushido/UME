'use client'

import React from 'react'
import {
    Calendar,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    Ban
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Activity {
    id: string
    type: 'request' | 'message'
    title: string
    subtitle: string
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
    date: Date
    content?: string
}

interface ActivityFeedProps {
    activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <div className="bg-card p-12 rounded-xl shadow-sm text-center border-2 border-dashed border-muted/50">
                <div className="bg-muted/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="text-muted-foreground h-6 w-6" />
                </div>
                <p className="text-muted-foreground font-medium">No hay actividad reciente.</p>
                <p className="text-xs text-muted-foreground mt-1">Tus solicitudes y mensajes aparecerán aquí.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => (
                <div
                    key={activity.id}
                    className="group bg-card hover:bg-muted/30 transition-all p-4 rounded-xl border border-border/50 shadow-sm flex items-start gap-4 relative overflow-hidden"
                >
                    {/* Status accent for requests */}
                    {activity.type === 'request' && (
                        <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            activity.status === 'approved' && "bg-green-500",
                            activity.status === 'pending' && "bg-amber-500",
                            activity.status === 'rejected' && "bg-red-500",
                            activity.status === 'cancelled' && "bg-slate-500",
                        )} />
                    )}

                    <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        activity.type === 'request' ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-500"
                    )}>
                        {activity.type === 'request' ? (
                            <Calendar className="h-5 w-5" />
                        ) : (
                            <MessageSquare className="h-5 w-5" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-sm truncate">
                                {activity.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold shrink-0">
                                {formatDistanceToNow(activity.date, { addSuffix: true, locale: es })}
                            </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {activity.subtitle}
                        </p>

                        {activity.content && (
                            <p className="text-sm mt-2 text-foreground/80 line-clamp-2 italic bg-muted/20 p-2 rounded-md">
                                &quot;{activity.content}&quot;
                            </p>
                        )}

                        {activity.type === 'request' && (
                            <div className="flex items-center gap-1.5 mt-2">
                                {activity.status === 'approved' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full uppercase">
                                        <CheckCircle2 className="h-3 w-3" /> Aprobada
                                    </span>
                                )}
                                {activity.status === 'pending' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                                        <Clock className="h-3 w-3" /> Pendiente
                                    </span>
                                )}
                                {activity.status === 'rejected' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full uppercase">
                                        <XCircle className="h-3 w-3" /> Rechazada
                                    </span>
                                )}
                                {activity.status === 'cancelled' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-500/10 px-2 py-0.5 rounded-full uppercase">
                                        <Ban className="h-3 w-3" /> Cancelada
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors self-center" />
                </div>
            ))}
        </div>
    )
}
