import { NextRequest, NextResponse } from 'next/server'
import agentRunsData from '@/lib/data/agent-runs.json'
import { AgentRun } from '@/types'

// In-memory storage (shared with parent route)
let agentRuns: AgentRun[] = [...(agentRunsData as AgentRun[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeTasks = searchParams.get('include_tasks') !== 'false'

    const id = parseInt(params.id)
    const run = agentRuns.find(r => r.id === id)

    if (!run) {
      return NextResponse.json(
        { error: 'Agent run not found' },
        { status: 404 }
      )
    }

    // Optionally exclude tasks
    const result = includeTasks ? run : { ...run, tasks: undefined }

    return NextResponse.json(result)
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

    const id = parseInt(params.id)
    const runIndex = agentRuns.findIndex(r => r.id === id)

    if (runIndex === -1) {
      return NextResponse.json(
        { error: 'Agent run not found' },
        { status: 404 }
      )
    }

    // Update the run status
    agentRuns[runIndex] = {
      ...agentRuns[runIndex],
      status,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(agentRuns[runIndex])
  } catch (error) {
    console.error('Error updating agent run:', error)
    return NextResponse.json(
      { error: 'Failed to update agent run' },
      { status: 500 }
    )
  }
}

