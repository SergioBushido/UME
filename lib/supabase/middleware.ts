import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes logic
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/user')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Redirect user trying to access admin
        if (request.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/user/dashboard', request.url))
        }

        // Redirect admin trying to access user (Strict separation)
        // Note: If you want admins to see user views, remove this block or modify it.
        if (request.nextUrl.pathname.startsWith('/user') && profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
    }

    // Redirect root to appropriate dashboard
    if (request.nextUrl.pathname === '/') {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        } else {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'admin') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url))
            } else {
                return NextResponse.redirect(new URL('/user/dashboard', request.url))
            }
        }
    }

    return supabaseResponse
}
