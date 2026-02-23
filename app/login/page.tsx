import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Mail } from 'lucide-react'
import Image from 'next/image'
import { Footer } from '@/components/shared/footer'

export default function LoginPage() {
    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center overflow-x-hidden pt-12">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 h-screen">
                <div className="absolute inset-0 bg-black/60 z-10" /> {/* Dark overlay */}
                <Image
                    src="/bg-background"
                    alt="SIGEO Background"
                    fill
                    className="object-cover object-center"
                    priority
                />
            </div>

            <div className="relative z-10 w-full max-w-sm px-4 flex flex-col items-center">
                {/* UME Logo */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/logo_ume.png"
                        alt="SIGEO Logo"
                        width={180}
                        height={180}
                        className="drop-shadow-2xl animate-in fade-in zoom-in duration-700"
                    />
                </div>

                {/* Spanish Flag */}
                <div className="flex w-full h-10 mb-8 shadow-lg rounded-sm overflow-hidden border border-black/30">
                    <div className="h-full w-1/4 bg-[#AA151B]"></div> {/* Rojo */}
                    <div className="h-full w-2/4 bg-[#F1BF00] flex items-center justify-center">
                    </div>
                    <div className="h-full w-1/4 bg-[#AA151B]"></div> {/* Rojo */}
                </div>

                <div className="mb-8 text-center text-white">
                    <h1 className="text-5xl font-extrabold tracking-tighter mb-2 text-primary drop-shadow-md">SIGEO</h1>
                    <p className="text-sm font-light tracking-[0.2em] opacity-90 leading-tight uppercase text-center">Sistema Integral de Gestión de Efectivos Operativos</p>
                </div>
                <Card className="w-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-white uppercase tracking-tight">Acceso al Sistema</CardTitle>
                        <CardDescription className="text-gray-300">
                            Identifíquese para gestionar su perfil.
                        </CardDescription>
                    </CardHeader>
                    <form action={login}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground/90">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="rango.apellido@ume.es"
                                        className="pl-10 bg-background/50 border-input text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground/90">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 bg-background/50 border-input text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold shadow-md transition-all duration-200 py-6 text-lg" type="submit">
                                ENTRAR AL PORTAL
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            <div className="mt-auto w-full relative z-20">
                <Footer />
            </div>
        </div>
    )
}
