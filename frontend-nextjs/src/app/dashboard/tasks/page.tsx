'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AgentRunList, AgentRun } from '@/types'
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import AgentBadge from '@/components/team/AgentBadge'
import { getAgentByTaskType } from '@/lib/constants/agents'
import type { AgentId } from '@/types'

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedRuns, setExpandedRuns] = useState<Set<string | number>>(new Set())

  const { data, isLoading } = useQuery<AgentRunList>({
    queryKey: ['agent-runs', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const response = await axios.get(`/api/agent/runs${params}`)
      return response.data
    },
    refetchInterval: 3000, // 每3秒自动刷新
  })

  const toggleRun = (runId: string | number) => {
    const newExpanded = new Set(expandedRuns)
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId)
    } else {
      newExpanded.add(runId)
    }
    setExpandedRuns(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      active: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status === 'active' && (
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
        )}
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getTaskTypeLabel = (taskType: string) => {
    const labels: Record<string, string> = {
      ask_slot: 'Ask Information',
      generate_content: 'Generate Content',
      verify: 'Verify Content',
    }
    return labels[taskType] || taskType
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const runs = data?.runs || []
  const activeRuns = runs.filter((r) => r.status === 'active')
  const completedRuns = runs.filter((r) => r.status === 'completed')
  const failedRuns = runs.filter((r) => r.status === 'failed')

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Activity className="h-8 w-8 mr-3 text-primary" />
          Task Monitor
        </h1>
        <p className="mt-2 text-gray-600">Real-time view of Agent work progress</p>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tasks
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {data.total}
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
                  <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active
                    </dt>
                    <dd className="text-3xl font-semibold text-green-600">
                      {data.active_count}
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
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-3xl font-semibold text-blue-600">
                      {data.completed_count}
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
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Failed
                    </dt>
                    <dd className="text-3xl font-semibold text-red-600">
                      {data.failed_count}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setStatusFilter('all')}
              className={`${
                statusFilter === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All ({data?.total || 0})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`${
                statusFilter === 'active'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Active ({data?.active_count || 0})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`${
                statusFilter === 'completed'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed ({data?.completed_count || 0})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`${
                statusFilter === 'failed'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Failed ({data?.failed_count || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Runs List */}
      {runs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Tasks Found
          </h3>
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'No tasks yet'
              : `No ${statusFilter === 'active' ? 'active' : statusFilter === 'completed' ? 'completed' : 'failed'} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              isExpanded={expandedRuns.has(run.id)}
              onToggle={() => toggleRun(run.id)}
              getStatusIcon={getStatusIcon}
              getStatusBadge={getStatusBadge}
              getTaskTypeLabel={getTaskTypeLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// RunCard Component
function RunCard({
  run,
  isExpanded,
  onToggle,
  getStatusIcon,
  getStatusBadge,
  getTaskTypeLabel,
}: {
  run: AgentRun
  isExpanded: boolean
  onToggle: () => void
  getStatusIcon: (status: string) => JSX.Element
  getStatusBadge: (status: string) => JSX.Element
  getTaskTypeLabel: (taskType: string) => string
}) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {getStatusIcon(run.status)}
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                {run.user_intent}
              </h3>
            </div>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(run.created_at).toLocaleString('en-US')}
              </span>
              <span>ID: {run.id}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(run.status)}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(run.progress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                run.status === 'completed'
                  ? 'bg-green-500'
                  : run.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${run.progress * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expanded Content - Tasks Timeline */}
      {isExpanded && run.tasks && run.tasks.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Task Timeline</h4>
          <div className="space-y-3">
            {run.tasks.map((task, index) => {
              const agent = getAgentByTaskType(task.task_type)
              return (
                <div key={task.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AgentBadge agentId={agent.id as AgentId} size="sm" />
                        <p className="text-sm font-medium text-gray-900">
                          {getTaskTypeLabel(task.task_type)}
                        </p>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.created_at).toLocaleString('en-US')}
                    </p>
                    {task.result && (
                      <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(task.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

