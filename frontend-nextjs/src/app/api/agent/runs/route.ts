import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('limit', limit)
    params.append('offset', offset)

    const response = await fetch(
      `${BACKEND_URL}/api/agent/runs?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching agent runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent runs' },
      { status: 500 }
    )
  }
}

