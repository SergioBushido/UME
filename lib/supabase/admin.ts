import { createClient } from '@supabase/supabase-js'
import { getEnvVar } from '@/lib/env'

export function createAdminClient() {
    return createClient(
        getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
        getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
