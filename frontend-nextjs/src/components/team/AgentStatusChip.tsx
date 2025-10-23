import { AgentId, AgentStatus } from '@/types'
import { AGENTS, AGENT_STATUS_CONFIG } from '@/lib/constants/agents'
import Link from 'next/link'
import AgentAvatar from './AgentAvatar'

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

  return (
    <Link
      href="/dashboard/team"
      className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all"
    >
      <AgentAvatar agentId={agentId} size="sm" showStatus status={status} />
      <span className="text-sm font-medium text-gray-900">{agent.name}</span>
      {taskCount > 0 && (
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {taskCount}
        </span>
      )}
    </Link>
  )
}

