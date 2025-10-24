'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { AgentRun } from '@/types'

export default function AgentWorkbenchSummary() {
  const { data: runsData = { data: [], stats: {} }, isLoading } = useQuery({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      const res = await fetch('/api/agent/runs')
      return res.json()
    },
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  })

  const activeRuns = runsData.data?.filter((run: AgentRun) => run.status === 'active') || []
  const stats = runsData.stats || {}

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="text-blue-600 animate-pulse" size={20} />
      case 'completed':
        return <CheckCircle2 className="text-green-600" size={20} />
      case 'failed':
        return <AlertCircle className="text-red-600" size={20} />
      default:
        return <Clock className="text-gray-600" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 border-blue-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m`
    return `${Math.floor(duration / 3600)}h`
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Runs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total_runs || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50">
          <p className="text-blue-600 text-sm font-medium">Active</p>
          <p className="text-2xl font-bold text-blue-900">{stats.active_runs || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
          <p className="text-green-600 text-sm font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completed_runs || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-red-600 text-sm font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-900">{stats.failed_runs || 0}</p>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Active Tasks</h3>
          <Link
            href="/dashboard/tasks"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : activeRuns.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No active tasks</div>
        ) : (
          <div className="divide-y">
            {activeRuns.slice(0, 5).map((run: AgentRun) => (
              <div key={run.id} className={`p-4 border-l-4 ${getStatusColor(run.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <h4 className="font-medium text-gray-900">{run.user_intent}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Running for {formatDuration(run.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {Math.round(run.progress * 100)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${run.progress * 100}%` }}
                  />
                </div>

                {/* Task Count */}
                <div className="mt-2 text-xs text-gray-600">
                  {run.tasks?.filter(t => t.status === 'completed').length || 0} of{' '}
                  {run.tasks?.length || 0} tasks completed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Average Duration</p>
          <p className="text-xl font-bold text-gray-900 mt-1">~2m 30s</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Success Rate</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {stats.total_runs && stats.completed_runs
              ? Math.round((stats.completed_runs / stats.total_runs) * 100)
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  )
}

