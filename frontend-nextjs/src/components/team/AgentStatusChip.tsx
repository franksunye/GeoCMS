import { AgentId, AgentStatus } from '@/types'
import { AGENTS, AGENT_STATUS_CONFIG } from '@/lib/constants/agents'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface AgentStatusChipProps {
  agentId: AgentId
  status: AgentStatus
  taskCount: number
}

export default function AgentStatusChip({
  agentId,
  status,
  taskCount
}: AgentStatusChipProps) {
  const agent = AGENTS[agentId]
  const statusConfig = AGENT_STATUS_CONFIG[status]
  const Icon = agent.icon as LucideIcon

  return (
    <Link
      href="/dashboard/team"
      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all"
    >
      <Icon className={`h-4 w-4 ${agent.textColor}`} />
      <span className="text-sm font-medium text-gray-900">{agent.name}</span>
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${statusConfig.dotColor} ${statusConfig.animate ? 'animate-pulse' : ''}`} />
        {taskCount > 0 && (
          <span className="text-xs font-semibold text-gray-600">{taskCount}</span>
        )}
      </div>
    </Link>
  )
}

