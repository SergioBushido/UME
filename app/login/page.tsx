import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Mail } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/60 z-10" /> {/* Dark overlay */}
                <Image
                    src="/bg-background"
                    alt="UME Background"
                    fill
                    className="object-cover object-center"
                    priority
                />
            </div>

            <div className="relative z-10 w-full max-w-sm px-4">
                {/* Spanish Flag */}
                <div className="flex w-full h-12 mb-8 shadow-lg rounded-sm overflow-hidden border border-black/30">
                    <div className="h-full w-1/4 bg-[#AA151B]"></div> {/* Rojo */}
                    <div className="h-full w-2/4 bg-[#F1BF00] flex items-center justify-center">
                        {/* Optional: Escudo could go here if available, plain for now */}
                    </div>
                    <div className="h-full w-1/4 bg-[#AA151B]"></div> {/* Rojo */}
                </div>

                <div className="mb-8 text-center text-white">
                    <h1 className="text-4xl font-extrabold tracking-tighter mb-2 text-primary drop-shadow-md">UME</h1>
                    <p className="text-lg font-light tracking-wide opacity-90">Gestión de Permisos y Turnos</p>
                </div>
                <Card className="w-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-white">Bienvenido</CardTitle>
                        <CardDescription className="text-gray-300">
                            Acceso exclusivo para personal autorizado.
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
                                        className="pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
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
                                        className="pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold shadow-md transition-all duration-200" type="submit">
                                Iniciar Sesión
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>© 2024 Unidad Militar de Emergencias</p>
                    <p>Sistema de uso oficial únicamente.</p>
                </div>
            </div>
        </div>
    )
}
