import { createAdminClient } from '../lib/supabase/admin'

async function main() {
  const supabase = createAdminClient()

  // Leer todos los registros
  const { data: all, error: readError } = await supabase.from('system_settings').select('*')
  console.log('Todos los registros:', all, readError)

  // Insertar valor de prueba
  const testValue = [{ start: '2026-04-01', end: '2026-04-10' }]
  const { error: insertError } = await supabase.from('system_settings').upsert({ key: 'blocked_weeks', value: testValue })
  if (insertError) {
    console.error('Error al insertar:', insertError)
  } else {
    console.log('Insert/Upsert realizado')
  }

  // Leer de nuevo
  const { data: after, error: afterError } = await supabase.from('system_settings').select('*').eq('key', 'blocked_weeks')
  console.log('Después del insert:', after, afterError)
}

main().catch(console.error)
