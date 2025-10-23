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
    const limit = parseInt(searchParams.get('limit') || '10')

    // Sort by updated_at descending (most recently updated first)
    const topKnowledge = [...knowledge]
      .sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, limit)

    return NextResponse.json(topKnowledge)
  } catch (error) {
    console.error('Error fetching top knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top knowledge' },
      { status: 500 }
    )
  }
}

