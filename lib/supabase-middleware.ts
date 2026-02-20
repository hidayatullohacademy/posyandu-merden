import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/', '/_not-found'];
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (user && request.nextUrl.pathname === '/login') {
        // Get user role from users table
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role || 'ORANG_TUA';
        const url = request.nextUrl.clone();

        switch (role) {
            case 'ADMIN':
                url.pathname = '/admin/dashboard';
                break;
            case 'KADER':
                url.pathname = '/kader/dashboard';
                break;
            case 'ORANG_TUA':
                url.pathname = '/ortu/dashboard';
                break;
            default:
                url.pathname = '/login';
        }

        return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (user) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = userData?.role;
        const path = request.nextUrl.pathname;

        if (path.startsWith('/admin') && role !== 'ADMIN') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
        if (path.startsWith('/kader') && role !== 'KADER') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
        if (path.startsWith('/ortu') && role !== 'ORANG_TUA') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
