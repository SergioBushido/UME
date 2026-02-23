import { createClient } from '@supabase/supabase-js'
import { getEnvVar } from '@/lib/env'


export function createAdminClient() {
    const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

    return createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
