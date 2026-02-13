import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Users, Calendar, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border shadow-md flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-xl font-bold text-primary">Admin Portal</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestión de Turnos</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start hover:bg-muted" asChild>
                        <Link href="/admin/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start hover:bg-muted" asChild>
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4" />
                            Usuarios
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start hover:bg-muted" asChild>
                        <Link href="/admin/requests">
                            <Calendar className="mr-2 h-4 w-4" />
                            Solicitudes
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start hover:bg-muted" asChild>
                        <Link href="/admin/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Configuración
                        </Link>
                    </Button>
                </nav>

                <div className="p-4 border-t border-border">
                    <form action="/auth/signout" method="post">
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    )
}
