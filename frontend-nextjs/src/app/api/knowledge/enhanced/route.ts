import { NextRequest, NextResponse } from 'next/server'
import knowledgeData from '@/lib/data/knowledge.json'
import { Knowledge } from '@/types'

// In-memory storage (shared with parent route)
let knowledge: Knowledge[] = [...(knowledgeData as Knowledge[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const sortBy = searchParams.get('sort_by') || 'updated_at'
    const order = searchParams.get('order') || 'desc'

    let filtered = knowledge

    // Filter by query
    if (query) {
      const queryLower = query.toLowerCase()
      filtered = filtered.filter(k =>
        k.topic.toLowerCase().includes(queryLower) ||
        JSON.stringify(k.content).toLowerCase().includes(queryLower)
      )
    }

    // Sort
    filtered = filtered.sort((a, b) => {
      const aValue = sortBy === 'updated_at' ? new Date(a.updated_at).getTime() : a.id
      const bValue = sortBy === 'updated_at' ? new Date(b.updated_at).getTime() : b.id
      return order === 'desc' ? bValue - aValue : aValue - bValue
    })

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error fetching enhanced knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enhanced knowledge' },
      { status: 500 }
    )
  }
}

