import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Calendar, Home, History, LogOut, PlusCircle, MessageSquare } from "lucide-react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UserLayout({
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
        <div className="min-h-screen bg-background flex flex-col text-foreground">
            <header className="bg-card shadow-sm sticky top-0 z-10 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="font-bold text-xl text-primary">Portal Empleado</span>
                            </div>
                            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link href="/user/dashboard" className="border-transparent text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    <Home className="mr-2 h-4 w-4" />
                                    Inicio
                                </Link>
                                <Link href="/user/requests/new" className="border-transparent text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Nueva Solicitud
                                </Link>
                                <Link href="/user/requests" className="border-transparent text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    <History className="mr-2 h-4 w-4" />
                                    Historial
                                </Link>
                                <Link href="/user/messages" className="border-transparent text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Mensajes
                                </Link>
                                <Link href="/user/calendar" className="border-transparent text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Calendario
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-4">{user.email}</span>
                            <form action="/auth/signout" method="post">
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    )
}
