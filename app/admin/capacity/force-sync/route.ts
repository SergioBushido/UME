import { NextResponse } from 'next/server'
import { syncCapacityData } from '@/app/admin/capacity/sync-action'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify session and role
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    await syncCapacityData()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 })
  }
}
