import React from 'react'

export function Footer() {
    return (
        <footer className="py-6 px-4 bg-muted/20 border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto text-center space-y-2">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    SIGEO® <span className="mx-2 text-border">|</span> <span className="italic">Por tierra y por Mar.</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 uppercase font-medium">
                    Sistema Integral de Gestión de Efectivos Operativos
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40">
                    <span>Marca Registrada</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>Desarrollado por Mike y Pescao</span>
                </div>
            </div>
        </footer>
    )
}
