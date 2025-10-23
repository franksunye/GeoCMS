import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeTasks = searchParams.get('include_tasks') !== 'false'

    const queryParams = new URLSearchParams()
    queryParams.append('include_tasks', includeTasks.toString())

    const response = await fetch(
      `${BACKEND_URL}/api/agent/runs/${params.id}?${queryParams.toString()}`,
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
    console.error('Error fetching agent run:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent run' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const queryParams = new URLSearchParams()
    queryParams.append('status', status)

    const response = await fetch(
      `${BACKEND_URL}/api/agent/runs/${params.id}?${queryParams.toString()}`,
      {
        method: 'PATCH',
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
    console.error('Error updating agent run:', error)
    return NextResponse.json(
      { error: 'Failed to update agent run' },
      { status: 500 }
    )
  }
}

