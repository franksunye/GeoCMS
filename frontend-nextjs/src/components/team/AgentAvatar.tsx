import { AgentId } from '@/types'
import { AGENTS } from '@/lib/constants/agents'
import Image from 'next/image'

interface AgentAvatarProps {
  agentId: string
  name?: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  status?: 'active' | 'idle' | 'scheduled' | 'waiting'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

const statusDotSizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5'
}

const sizePixels = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96
}

export default function AgentAvatar({
  agentId,
  name,
  avatarUrl,
  size = 'md',
  showStatus = false,
  status = 'idle'
}: AgentAvatarProps) {
  let avatarSrc = avatarUrl
  let altText = name

  // Check if it matches a system agent
  const systemAgent = AGENTS[agentId as AgentId]
  
  if (systemAgent && !avatarSrc) {
    avatarSrc = systemAgent.avatar
    altText = altText || systemAgent.name
  }

  // Fallback to generated avatar
  if (!avatarSrc) {
    const seed = name || agentId || 'default'
    avatarSrc = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e5e7eb&backgroundType=gradientLinear`
    altText = altText || 'Agent'
  }

  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    scheduled: 'bg-blue-500',
    waiting: 'bg-gray-500'
  }

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-lg ring-2 ring-white bg-gray-100`}>
        <Image
          src={avatarSrc}
          alt={altText}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="object-cover"
          unoptimized // For external SVG URLs
        />
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusDotSizes[size]} ${statusColors[status]} rounded-full border-2 border-white shadow-sm ${status === 'active' ? 'animate-pulse' : ''}`} />
      )}
    </div>
  )
}
