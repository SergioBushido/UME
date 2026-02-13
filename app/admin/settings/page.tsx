import { createClient } from '@/lib/supabase/server'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateSettings } from './actions'

export default async function SettingsPage() {
    const supabase = await createClient()

    // Fetch current settings
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')

    // Convert array to object for easier access
    const config = settings?.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {} as Record<string, any>) || {}

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configuración Global</h2>
                <p className="text-muted-foreground">Gestiona reglas y bloqueos del sistema.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Semanas Bloqueadas</CardTitle>
                        <CardDescription>Define rangos de fechas donde NO se pueden solicitar permisos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={updateSettings}>
                            <input type="hidden" name="key" value="blocked_weeks" />
                            <div className="space-y-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="blocked_weeks">Rangos (JSON format por ahora)</Label>
                                    <Textarea
                                        id="blocked_weeks"
                                        name="value"
                                        placeholder='[{"start": "2024-12-20", "end": "2025-01-07"}]'
                                        defaultValue={JSON.stringify(config.blocked_weeks || [], null, 2)}
                                        className="font-mono"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Introduce un array JSON con objetos que tengan "start" y "end".
                                    </p>
                                </div>
                                <Button type="submit">Guardar Bloqueos</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Límites de Personal</CardTitle>
                        <CardDescription>Configura el mínimo de personal requerido.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={updateSettings}>
                            <input type="hidden" name="key" value="min_staffing" />
                            <div className="space-y-4">
                                <div className="grid w-full max-w-sm gap-1.5">
                                    <Label htmlFor="min_percent">Porcentaje Mínimo (%)</Label>
                                    <Input
                                        type="number"
                                        id="min_percent"
                                        name="value"
                                        placeholder="30"
                                        defaultValue={config.min_staffing?.percent || 30}
                                    />
                                </div>
                                <Button type="submit">Guardar Límite</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
