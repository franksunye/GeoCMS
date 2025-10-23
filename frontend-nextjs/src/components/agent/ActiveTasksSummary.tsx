'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AgentRunList } from '@/types'
import { Activity, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { StatCardSkeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-boundary'
import AgentBadge from '@/components/team/AgentBadge'
import AgentAvatar from '@/components/team/AgentAvatar'
import { getAgentByTaskType } from '@/lib/constants/agents'
import type { AgentId } from '@/types'

export default function ActiveTasksSummary() {
  const { data, isLoading, error, refetch } = useQuery<AgentRunList>({
    queryKey: ['agent-runs', 'active'],
    queryFn: async () => {
      const response = await axios.get('/api/agent/runs?status=active&limit=5')
      return response.data
    },
    refetchInterval: 3000, // 每3秒自动刷新
    retry: 3, // 失败后重试3次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
  })

  if (isLoading) {
    return <StatCardSkeleton />
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Agent Workspace
          </h2>
        </div>
        <ErrorDisplay
          error={error as Error}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const activeRuns = data?.runs || []
  const hasActiveRuns = activeRuns.length > 0

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Agent Workspace
          {data && data.active_count > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {data.active_count} active tasks
            </span>
          )}
        </h2>
        <Link
          href="/dashboard/tasks"
          className="text-sm text-primary hover:text-primary/80 flex items-center"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {!hasActiveRuns ? (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active tasks currently</p>
          <p className="text-sm text-gray-400 mt-1">
            Agent will display ongoing work here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRuns.map((run) => {
            const lastTask = run.tasks?.[run.tasks.length - 1]
            const agent = lastTask ? getAgentByTaskType(lastTask.task_type) : null

            return (
              <Link
                key={run.id}
                href={`/dashboard/tasks/${run.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-primary hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  {/* Agent Avatar */}
                  {agent && (
                    <div className="flex-shrink-0 mt-1">
                      <AgentAvatar
                        agentId={agent.id as AgentId}
                        size="md"
                        showStatus
                        status="active"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {run.user_intent}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(run.created_at).toLocaleString('en-US')}
                        </div>
                      </div>
                      <div className="flex items-center ml-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                          Running
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(run.progress * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${run.progress * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Current Status with Agent Badge */}
                    {agent && lastTask && (
                      <div className="flex items-center gap-2 text-sm">
                        <AgentBadge agentId={agent.id as AgentId} size="sm" />
                        <span className="text-gray-600">
                          {lastTask.task_type === 'ask_slot' && 'asking for information'}
                          {lastTask.task_type === 'generate_content' && 'generating content'}
                          {lastTask.task_type === 'verify' && 'checking quality'}
                          {!['ask_slot', 'generate_content', 'verify'].includes(lastTask.task_type) && 'working'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Statistics */}
      {data && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {data.active_count}
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-green-600">
                {data.completed_count}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-600">
                {data.failed_count}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

