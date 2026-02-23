import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Calendar, Home, History, LogOut, PlusCircle, MessageSquare, Menu } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { StickyChatIcon } from '@/components/shared/sticky-chat-icon'
import Image from 'next/image'
import { UserNav } from '@/components/auth/user-nav'
import { Footer } from '@/components/shared/footer'

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

    const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen bg-background flex flex-col text-foreground">
            <header className="bg-card shadow-sm sticky top-0 z-10 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center gap-3">
                                <Image
                                    src="/logo_ume.png"
                                    alt="SIGEO Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                                <span className="font-black text-2xl text-primary tracking-tighter">SIGEO</span>
                            </div>
                            <nav className="hidden md:ml-6 md:flex md:space-x-8">
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
                                <Link href="/user/calendar" className="border-transparent text-muted-foreground hover:text-foreground hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Calendario
                                </Link>
                            </nav>
                            <div className="flex md:hidden items-center ml-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Menu className="h-6 w-6" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link href="/user/dashboard" className="flex items-center">
                                                <Home className="mr-2 h-4 w-4" />
                                                Inicio
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/user/requests/new" className="flex items-center">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Nueva Solicitud
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/user/requests" className="flex items-center">
                                                <History className="mr-2 h-4 w-4" />
                                                Historial
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/user/calendar" className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Calendario
                                            </Link>
                                        </DropdownMenuItem>
                                        <div className="h-px bg-border my-1" />
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Tema
                                        </div>
                                        <div className="flex items-center justify-around py-2">
                                            <ModeToggle />
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ModeToggle />
                            <UserNav
                                email={user.email}
                                userId={user.id}
                                initialAvatarUrl={profile?.avatar_url}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
            <Footer />
            <StickyChatIcon />
        </div>
    )
}
