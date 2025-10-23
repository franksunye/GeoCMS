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
    const days = parseInt(searchParams.get('days') || '90')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Filter knowledge that hasn't been updated in the specified days
    const outdated = knowledge.filter(k => {
      const updatedAt = new Date(k.updated_at)
      return updatedAt < cutoffDate
    })

    // Sort by updated_at ascending (oldest first)
    outdated.sort((a, b) =>
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    )

    return NextResponse.json(outdated)
  } catch (error) {
    console.error('Error fetching outdated knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outdated knowledge' },
      { status: 500 }
    )
  }
}

