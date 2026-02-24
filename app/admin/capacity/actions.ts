'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export async function getDayDetails(date: string) {
    const supabase = await createClient()

    // 1. Fetch capacity config for this day
    const { data: capacity } = await supabase
        .from('daily_availability')
        .select('*')
        .eq('date', date)
        .single()

    // 2. Fetch requests that include this date
    const { data: requests } = await supabase
        .from('requests')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .lte('start_date', date)
        .gte('end_date', date)
        .neq('status', 'cancelled') // Hide cancelled requests
        .order('created_at', { ascending: false }) // Order by newest

    logger.debug(`getDayDetails for ${date}: Found ${requests?.length ?? 0} requests (excluding cancelled).`)


    // 3. Fetch special events ? (Optional, but good for context)
    const { data: events } = await supabase
        .from('special_events')
        .select(`
             *,
            profiles (
                full_name
            )
        `)
        .eq('date', date)

    // 4. Fetch ALL profiles to calculate presence
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, section')
        .order('full_name')

    return {
        capacity,
        requests: requests || [],
        events: events || [],
        allProfiles: allProfiles || []
    }
}

export async function revokeRequest(requestId: string, path: string) {
    console.log(`[REVOKE] Starting revocation for request: ${requestId}`)
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('[REVOKE] No user found in session')
        throw new Error('Unauthorized')
    }

    // 1. Get request details
    const { data: req, error: fetchError } = await supabaseAdmin
        .from('requests')
        .select('*, profiles(full_name)')
        .eq('id', requestId)
        .single()

    if (fetchError || !req) {
        console.error(`[REVOKE] Request not found: ${requestId}`, fetchError)
        throw new Error('Request not found')
    }

    console.log(`[REVOKE] Found request for ${req.profiles?.full_name}: ${req.type} (${req.status})`)

    // 2. Revert capacity/balances if it was approved
    if (req.status === 'approved') {
        console.log(`[REVOKE] Reverting capacity for approved request...`)
        const { error: revertError } = await supabaseAdmin.rpc('revert_capacity_for_request', {
            request_id: requestId
        })
        if (revertError) {
            console.error('[REVOKE] Error reverting capacity:', revertError)
            throw new Error('Error al revertir capacidad: ' + revertError.message)
        }
        console.log(`[REVOKE] Capacity reverted successfully.`)
    }

    // 3. HARD DELETE using admin client to bypass RLS
    console.log(`[REVOKE] Deleting request record...`)
    const { error: deleteError } = await supabaseAdmin
        .from('requests')
        .delete()
        .eq('id', requestId)

    if (deleteError) {
        console.error('[REVOKE] Error deleting request:', deleteError)
        throw new Error(deleteError.message)
    }
    console.log(`[REVOKE] Request record deleted successfully.`)

    // 4. Regenerate availability
    console.log(`[REVOKE] Regenerating availability...`)
    const { regenerateDailyAvailability } = await import('@/app/admin/settings/capacity-actions')
    await regenerateDailyAvailability(new Date(req.start_date), new Date(req.end_date))
    console.log(`[REVOKE] Availability regenerated.`)

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/capacity')
    console.log(`[REVOKE] Revocation complete.`)
}
