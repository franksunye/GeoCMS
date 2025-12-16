import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()

        // Retrieve password from Environment Variable
        // If not set, fallback to a default for development (SAFETY WARNING will remain until set)
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

        if (!ADMIN_PASSWORD) {
            console.warn('WARNING: ADMIN_PASSWORD environment variable is not set. Auth will fail.')
            return NextResponse.json(
                { error: 'Server configuration error: Password not set' },
                { status: 500 }
            )
        }

        if (password === ADMIN_PASSWORD) {
            // Set HttpOnly Cookie
            cookies().set('auth_token', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json(
            { error: 'Invalid password' },
            { status: 401 }
        )
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
