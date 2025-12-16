import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if the current path is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

    if (isProtectedRoute) {
        // Check for auth cookie
        const authCookie = request.cookies.get('auth_token')

        if (!authCookie || authCookie.value !== 'authenticated') {
            // Redirect to login page
            const loginUrl = new URL('/login', request.url)
            // Optional: Pass the redirect URL to handle redirects after login
            // loginUrl.searchParams.set('from', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    // Apply middleware to all routes matching /dashboard/:path* and /admin/:path*
    matcher: ['/dashboard/:path*', '/admin/:path*'],
}
