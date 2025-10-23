import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const tags = searchParams.get('tags')
    const minQuality = searchParams.get('min_quality')
    const includeArchived = searchParams.get('include_archived')
    const sortBy = searchParams.get('sort_by') || 'updated_at'
    const order = searchParams.get('order') || 'desc'

    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (tags) params.append('tags', tags)
    if (minQuality) params.append('min_quality', minQuality)
    if (includeArchived) params.append('include_archived', includeArchived)
    params.append('sort_by', sortBy)
    params.append('order', order)

    const response = await fetch(
      `${BACKEND_URL}/api/knowledge/enhanced?${params.toString()}`,
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
    console.error('Error fetching enhanced knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enhanced knowledge' },
      { status: 500 }
    )
  }
}

