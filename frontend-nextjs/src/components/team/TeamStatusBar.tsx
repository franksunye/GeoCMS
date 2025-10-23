'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AgentRunList } from '@/types'
import AgentStatusChip from './AgentStatusChip'
import { AGENTS, TASK_TYPE_TO_AGENT } from '@/lib/constants/agents'
import type { AgentId, AgentStatus } from '@/types'

export default function TeamStatusBar() {
  const { data } = useQuery<AgentRunList>({
    queryKey: ['agent-runs', 'active'],
    queryFn: async () => {
      const response = await axios.get('/api/agent/runs?status=active&limit=50')
      return response.data
    },
    refetchInterval: 3000,
  })

  // Calculate agent status and task counts
  const agentStats = Object.keys(AGENTS).reduce((acc, agentId) => {
    const id = agentId as AgentId
    const activeTasks = data?.runs.filter(run => {
      const lastTask = run.tasks?.[run.tasks.length - 1]
      if (!lastTask) return false
      const taskAgent = TASK_TYPE_TO_AGENT[lastTask.task_type]
      return taskAgent === id && run.status === 'active'
    }) || []

    acc[id] = {
      status: (activeTasks.length > 0 ? 'active' : 'idle') as AgentStatus,
      taskCount: activeTasks.length
    }
    return acc
  }, {} as Record<AgentId, { status: AgentStatus; taskCount: number }>)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">AI Content Team</h2>
        <span className="text-xs text-gray-500">Real-time status</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(AGENTS).map(([agentId, _]) => {
          const id = agentId as AgentId
          const stats = agentStats[id]
          return (
            <AgentStatusChip
              key={id}
              agentId={id}
              status={stats.status}
              taskCount={stats.taskCount}
            />
          )
        })}
      </div>
    </div>
  )
}

