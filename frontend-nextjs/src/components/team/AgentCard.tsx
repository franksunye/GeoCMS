'use client'

import { AgentId, AgentStatus } from '@/types'
import { AGENTS, AGENT_STATUS_CONFIG } from '@/lib/constants/agents'
import AgentAvatar from './AgentAvatar'
import { Clock, ListTodo, TrendingUp } from 'lucide-react'

interface AgentCardProps {
  agentId: AgentId
  status: AgentStatus
  currentTask?: {
    id: number
    type: string
    startedAt: string
  }
  queuedTasks: number
  nextScheduledTime?: string
  todayCompleted: number
}

export default function AgentCard({
  agentId,
  status,
  currentTask,
  queuedTasks,
  nextScheduledTime,
  todayCompleted
}: AgentCardProps) {
  const agent = AGENTS[agentId]
  const statusConfig = AGENT_STATUS_CONFIG[status]

  // Agent role badges
  const roleBadges = {
    knowledge: '🧠 AI Librarian',
    planner: '💡 Strategy Expert',
    writer: '✍️ Content Creator',
    verifier: '🛡️ Quality Guardian'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-gray-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <AgentAvatar agentId={agentId} size="lg" showStatus status={status} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-xs text-gray-500 mb-1">{roleBadges[agentId]}</p>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor} ${statusConfig.animate ? 'animate-pulse' : ''}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="font-medium text-blue-900">Working on:</span>
            <span className="text-blue-700">{currentTask.type}</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Started {new Date(currentTask.startedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ListTodo className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queuedTasks}</div>
          <div className="text-xs text-gray-500">Queued</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-green-600">{todayCompleted}</div>
          <div className="text-xs text-gray-500">Today</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {nextScheduledTime ? new Date(nextScheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </div>
          <div className="text-xs text-gray-500">Next Run</div>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Schedule</div>
        <div className="text-sm text-gray-700">{agent.schedule}</div>
      </div>

      {/* Triggers */}
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Triggers</div>
        <div className="flex flex-wrap gap-1">
          {agent.triggers.map((trigger, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
            >
              {trigger}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

