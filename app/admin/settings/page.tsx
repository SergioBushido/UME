import { createClient } from '@/lib/supabase/server'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateSettings } from './actions'
import { getCapacityConfig } from './capacity-actions'
import { StaffTab } from './staff-tab'
import { RulesTab } from './rules-tab'
import { BlockedWeeksManager } from '@/components/admin/blocked-weeks-manager'

export default async function SettingsPage() {
    const supabase = await createClient()

    // Fetch current settings (for blocked weeks)
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')

    // Convert array to object for easier access
    const config = settings?.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {} as Record<string, any>) || {}

    // Fetch capacity config
    const { staffLevels, presenceRules } = await getCapacityConfig()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configuración Global</h2>
                <p className="text-muted-foreground">Gestiona reglas, capacidad y bloqueos del sistema.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="staff">Plantilla</TabsTrigger>
                    <TabsTrigger value="rules">Reglas de Presencia</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Semanas Bloqueadas</CardTitle>
                                <CardDescription>Define periodos donde el personal no podrá solicitar permisos (Ej: Navidad, Verano intenso).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={updateSettings}>
                                    <input type="hidden" name="key" value="blocked_weeks" />
                                    <div className="space-y-6">
                                        <BlockedWeeksManager initialRanges={config.blocked_weeks || []} />

                                        <div className="pt-4 border-t">
                                            <Button type="submit" className="w-full sm:w-auto">Guardar Configuración de Bloqueos</Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="staff">
                    <StaffTab levels={staffLevels || []} />
                </TabsContent>

                <TabsContent value="rules">
                    <RulesTab rules={presenceRules || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
