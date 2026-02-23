"use client"

import * as React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Users, Calendar, Settings, LogOut, LayoutDashboard, ShieldCheck, CalendarRange, Menu, X, KeyRound } from "lucide-react"
import { ChangePasswordModal } from '@/components/auth/change-password-modal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ModeToggle } from '@/components/shared/mode-toggle'
import { cn } from '@/lib/utils'
import { StickyChatIcon } from '@/components/shared/sticky-chat-icon'
import { Footer } from '@/components/shared/footer'
import Image from 'next/image'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false)
    const router = useRouter()
    const supabase = createClient()

    React.useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, avatar_url')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                router.push('/user/dashboard')
                return
            }

            setUser({ ...user, avatar_url: profile?.avatar_url })
            setLoading(false)
        }
        checkUser()
    }, [router, supabase])

    if (loading) return null

    const navLinks = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Usuarios', icon: Users },
        { href: '/admin/requests', label: 'Solicitudes', icon: Calendar },
        { href: '/admin/capacity', label: 'Capacidad', icon: ShieldCheck },
        { href: '/admin/calendar', label: 'Calendario Global', icon: CalendarRange },
        { href: '/admin/settings', label: 'Configuración', icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        {user.avatar_url && (
                            <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-primary/20" />
                        )}
                        <span className="font-bold text-primary">SIGEO Admin</span>
                    </div>
                </div>
                <ModeToggle />
            </header>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop & Mobile) */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-md flex flex-col transition-transform duration-300 transform lg:relative lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-border flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="relative group">
                            <Image
                                src="/logo_ume.png"
                                alt="UME Logo"
                                width={80}
                                height={80}
                                className="object-contain"
                            />
                            {user.avatar_url && (
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-2 border-background overflow-hidden shadow-lg">
                                    <img src={user.avatar_url} alt="User Avatar" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-primary tracking-tighter">SIGEO</h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Portal de Administración</p>
                        <p className="text-xs text-muted-foreground mt-2 truncate max-w-[180px]">{user.email}</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navLinks.map((link) => (
                        <Button
                            key={link.href}
                            variant="ghost"
                            className="w-full justify-start hover:bg-muted font-medium"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Link href={link.href}>
                                <link.icon className="mr-3 h-5 w-5" />
                                {link.label}
                            </Link>
                        </Button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border space-y-4">
                    <div className="hidden lg:flex justify-center">
                        <ModeToggle />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-primary"
                        onClick={() => setIsPasswordModalOpen(true)}
                    >
                        <KeyRound className="mr-3 h-4 w-4" />
                        Cambiar Contraseña
                    </Button>

                    <form action="/auth/signout" method="post">
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 font-medium">
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background/50 relative flex flex-col">
                <div className="flex-1 p-4 lg:p-8 mt-16 lg:mt-0 pt-20 lg:pt-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
                <Footer />
                <StickyChatIcon />
            </main>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    )
}
