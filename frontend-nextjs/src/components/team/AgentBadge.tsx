import { AgentId } from '@/types'
import { AGENTS } from '@/lib/constants/agents'
import { LucideIcon } from 'lucide-react'

interface AgentBadgeProps {
  agentId: AgentId
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export default function AgentBadge({
  agentId,
  size = 'md',
  showIcon = true
}: AgentBadgeProps) {
  const agent = AGENTS[agentId]
  const Icon = agent.icon as LucideIcon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4'
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${agent.bgColor} text-white ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      <span>{agent.name}</span>
    </span>
  )
}

