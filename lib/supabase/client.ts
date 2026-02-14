import { createBrowserClient } from '@supabase/ssr'
import { getEnvVar } from '@/lib/env'

export function createClient() {
  return createBrowserClient(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
