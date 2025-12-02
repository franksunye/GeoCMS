'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AgentRunList } from '@/types'
import { Users, Activity } from 'lucide-react'
import AgentCard from '@/components/team/AgentCard'
import ActivityTimeline from '@/components/team/ActivityTimeline'
import { AGENTS, TASK_TYPE_TO_AGENT } from '@/lib/constants/agents'
import type { AgentId, AgentStatus, AgentStatusData } from '@/types'

export default function TeamPage() {
  const { data, isLoading } = useQuery<AgentRunList>({
    queryKey: ['agent-runs', 'all'],
    queryFn: async () => {
      const response = await axios.get('/api/agent/runs?limit=100')
      return response.data
    },
    refetchInterval: 3000,
  })

  // Calculate agent status data
  const agentStatusData: Record<AgentId, AgentStatusData> = Object.keys(AGENTS).reduce((acc, agentId) => {
    const id = agentId as AgentId
    
    // Find active tasks for this agent
    const activeTasks = data?.runs.filter(run => {
      const lastTask = run.tasks?.[run.tasks.length - 1]
      if (!lastTask) return false
      const taskAgent = TASK_TYPE_TO_AGENT[lastTask.task_type]
      return taskAgent === id && run.status === 'active'
    }) || []

    // Find current task
    const currentRun = activeTasks[0]
    const currentTask = currentRun?.tasks?.[currentRun.tasks.length - 1]

    // Count completed tasks today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCompleted = data?.runs.filter(run => {
      const lastTask = run.tasks?.[run.tasks.length - 1]
      if (!lastTask) return false
      const taskAgent = TASK_TYPE_TO_AGENT[lastTask.task_type]
      const completedAt = new Date(run.updated_at)
      return taskAgent === id && run.status === 'completed' && completedAt >= today
    }).length || 0

    // Determine status
    let status: AgentStatus = 'idle'
    if (activeTasks.length > 0) {
      status = 'active'
    } else if (id === 'planner' || id === 'knowledge' || id === 'call_analysis') {
      status = 'scheduled'
    }

    // Calculate next scheduled time (mock data for now)
    let nextScheduledTime: string | undefined
    if (id === 'planner') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      nextScheduledTime = tomorrow.toISOString()
    } else if (id === 'knowledge') {
      const today = new Date()
      today.setHours(22, 0, 0, 0)
      if (today < new Date()) {
        today.setDate(today.getDate() + 1)
      }
      nextScheduledTime = today.toISOString()
    } else if (id === 'call_analysis') {
      const today = new Date()
      today.setHours(19, 0, 0, 0)
      if (today < new Date()) {
        today.setDate(today.getDate() + 1)
      }
      nextScheduledTime = today.toISOString()
    }

    acc[id] = {
      agentId: id,
      status,
      currentTask: currentTask ? {
        id: currentTask.id,
        type: currentTask.task_type,
        startedAt: currentTask.created_at
      } : undefined,
      queuedTasks: activeTasks.length,
      nextScheduledTime,
      todayCompleted
    }

    return acc
  }, {} as Record<AgentId, AgentStatusData>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading team status...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="h-8 w-8 mr-3 text-primary" />
          AI Content Team
        </h1>
        <p className="mt-2 text-gray-600">
          Your virtual content production team working 24/7
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Team Members
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {Object.keys(AGENTS).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Now
                  </dt>
                  <dd className="text-3xl font-semibold text-green-600">
                    {Object.values(agentStatusData).filter(a => a.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tasks in Queue
                  </dt>
                  <dd className="text-3xl font-semibold text-blue-600">
                    {Object.values(agentStatusData).reduce((sum, a) => sum + a.queuedTasks, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Today
                  </dt>
                  <dd className="text-3xl font-semibold text-purple-600">
                    {Object.values(agentStatusData).reduce((sum, a) => sum + a.todayCompleted, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Object.entries(AGENTS).map(([agentId, _]) => {
            const id = agentId as AgentId
            const statusData = agentStatusData[id]
            return (
              <AgentCard
                key={id}
                agentId={id}
                status={statusData.status}
                currentTask={statusData.currentTask}
                queuedTasks={statusData.queuedTasks}
                nextScheduledTime={statusData.nextScheduledTime}
                todayCompleted={statusData.todayCompleted}
              />
            )
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Recent Activity
        </h2>
        <ActivityTimeline limit={15} />
      </div>
    </div>
  )
}
