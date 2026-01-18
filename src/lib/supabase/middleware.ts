import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake can make it very hard to debug
    // auth issues.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ALLOW PUBLIC ROUTES
    const isPublic =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/admin/login') // Admin login is public

    // 2. PROTECTED ROUTES LOGIC
    if (user) {
        // Fetch role nicely (we can't easily fetch DB in middleware without extra cost, 
        // but we can trust the client-side redirect for UX, and use RLS for data security).
        // HOWEVER, for strict routing, we rely on the specific paths.

        // Note: Reading DB in middleware is possible but adds latency. 
        // For this Vercel deployment, we'll keep it simple: 
        // We rely on the App Layouts to enforce access (Page Guards).
        // Middleware handles unauthenticated access mostly.

        // BUT, to fix your specific "Testing" issue where cached redirects confuse you:
        const path = request.nextUrl.pathname

        // Prevent loops: If on /login but getting redirects
        if (path.startsWith('/login') || path.startsWith('/register')) {
            const url = request.nextUrl.clone()
            url.pathname = '/' // Let the root page handler decide where to send them
            return NextResponse.redirect(url)
        }
    }

    if (!user && !isPublic) {
        const url = request.nextUrl.clone()
        if (request.nextUrl.pathname.startsWith('/admin')) {
            url.pathname = '/admin/login'
        } else {
            url.pathname = '/login'
        }
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid mutating
    //    the supabaseResponse object directly.

    return supabaseResponse
}
