import { NextRequest, NextResponse } from 'next/server'
import agentRunsData from '@/lib/data/agent-runs.json'
import { AgentRun } from '@/types'

// In-memory storage (resets on server restart)
let agentRuns: AgentRun[] = [...(agentRunsData as AgentRun[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter by status
    let filtered = agentRuns
    if (status) {
      filtered = filtered.filter(run => run.status === status)
    }

    // Sort by updated_at descending (most recent first)
    filtered = filtered.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    // Apply pagination
    const total = filtered.length
    const paginatedRuns = filtered.slice(offset, offset + limit)

    // Calculate counts
    const active_count = agentRuns.filter(r => r.status === 'active').length
    const completed_count = agentRuns.filter(r => r.status === 'completed').length
    const failed_count = agentRuns.filter(r => r.status === 'failed').length

    return NextResponse.json({
      total,
      active_count,
      completed_count,
      failed_count,
      runs: paginatedRuns
    })
  } catch (error) {
    console.error('Error fetching agent runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent runs' },
      { status: 500 }
    )
  }
}

