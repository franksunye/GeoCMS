import { NextResponse } from 'next/server'
import agentRunsData from '@/lib/data/agent-runs.json'
import { AgentRun } from '@/types'

// In-memory storage (shared with other routes)
let agentRuns: AgentRun[] = [...(agentRunsData as AgentRun[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Calculate statistics
    const total = agentRuns.length
    const active = agentRuns.filter(r => r.status === 'active').length
    const completed = agentRuns.filter(r => r.status === 'completed').length
    const failed = agentRuns.filter(r => r.status === 'failed').length

    // Calculate average progress for active runs
    const activeRuns = agentRuns.filter(r => r.status === 'active')
    const avgProgress = activeRuns.length > 0
      ? activeRuns.reduce((sum, r) => sum + r.progress, 0) / activeRuns.length
      : 0

    // Get recent runs (last 10)
    const recentRuns = [...agentRuns]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)

    const stats = {
      runs: {
        total,
        active,
        completed,
        failed,
        success_rate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
      },
      performance: {
        avg_progress: avgProgress.toFixed(1),
        active_tasks: activeRuns.reduce((sum, r) => sum + (r.tasks?.length || 0), 0)
      },
      recent_runs: recentRuns.map(r => ({
        id: r.id,
        user_intent: r.user_intent,
        status: r.status,
        progress: r.progress,
        updated_at: r.updated_at
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching agent stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent stats' },
      { status: 500 }
    )
  }
}

