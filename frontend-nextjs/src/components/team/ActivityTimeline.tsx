'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AgentRunList } from '@/types'
import { Clock, User, Bot, Settings } from 'lucide-react'
import AgentAvatar from './AgentAvatar'
import { getAgentByTaskType } from '@/lib/constants/agents'
import type { AgentId } from '@/types'
import Link from 'next/link'

interface ActivityTimelineProps {
  limit?: number
}

export default function ActivityTimeline({ limit = 10 }: ActivityTimelineProps) {
  const { data, isLoading } = useQuery<AgentRunList>({
    queryKey: ['agent-runs', 'timeline'],
    queryFn: async () => {
      const response = await axios.get(`/api/agent/runs?limit=${limit}`)
      return response.data
    },
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const activities = data?.runs || []

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((run) => {
        const lastTask = run.tasks?.[run.tasks.length - 1]
        const agent = lastTask ? getAgentByTaskType(lastTask.task_type) : null
        const isUserAction = !lastTask
        
        return (
          <Link
            key={run.id}
            href={`/dashboard/tasks/${run.id}`}
            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {agent ? (
                <AgentAvatar
                  agentId={agent.id as AgentId}
                  size="sm"
                  showStatus
                  status={run.status === 'active' ? 'active' : 'idle'}
                />
              ) : (
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {agent ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${agent.textColor}`}>
                        <Bot className="h-3 w-3" />
                        {agent.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                        <User className="h-3 w-3" />
                        User
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {run.status === 'completed' ? 'completed' : run.status === 'failed' ? 'failed' : 'working on'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 truncate">{run.user_intent}</p>
                  {lastTask && (
                    <p className="text-xs text-gray-500 mt-1">
                      Task: {lastTask.task_type}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {getRelativeTime(run.updated_at)}
                </div>
              </div>

              {/* Progress bar for active tasks */}
              {run.status === 'active' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${run.progress * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

