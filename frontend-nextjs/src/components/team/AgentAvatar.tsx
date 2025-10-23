import { AgentId } from '@/types'
import { AGENTS } from '@/lib/constants/agents'
import { LucideIcon } from 'lucide-react'

interface AgentAvatarProps {
  agentId: AgentId
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  status?: 'active' | 'idle' | 'scheduled' | 'waiting'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16'
}

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

const statusDotSizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4'
}

export default function AgentAvatar({
  agentId,
  size = 'md',
  showStatus = false,
  status = 'idle'
}: AgentAvatarProps) {
  const agent = AGENTS[agentId]
  const Icon = agent.icon as LucideIcon

  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    scheduled: 'bg-blue-500',
    waiting: 'bg-gray-500'
  }

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} ${agent.bgColor} rounded-full flex items-center justify-center`}>
        <Icon className={`${iconSizeClasses[size]} text-white`} />
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusDotSizes[size]} ${statusColors[status]} rounded-full border-2 border-white ${status === 'active' ? 'animate-pulse' : ''}`} />
      )}
    </div>
  )
}

