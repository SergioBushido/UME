import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'


export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Middleware Error: Missing Supabase Environment Variables')
            console.error('URL:', supabaseUrl ? 'Defined' : 'Undefined')
            console.error('Key:', supabaseAnonKey ? 'Defined' : 'Undefined')
            throw new Error('Missing Supabase Environment Variables')
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        // Do not attempt to mutate the incoming Request cookies —
                        // NextRequest.cookies is read-only in edge/middleware.
                        // Instead, set cookies on the response that will be returned.
                        supabaseResponse = NextResponse.next({ request })
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
    } catch (e) {
        console.error('Middleware Execution Error:', e)
        // Return original response if error, or maybe redirect to error page? 
        // For now, let's allow it to proceed but generic error might persist if we don't return something valid.
        // Returning the initial response is safer than crashing.
        return supabaseResponse
    }
}
