import { BookOpen, FileText, PenTool, CheckCircle } from 'lucide-react'

export type AgentId = 'knowledge' | 'planner' | 'writer' | 'verifier'

export type AgentStatus = 'active' | 'idle' | 'scheduled' | 'waiting'

export interface AgentConfig {
  id: AgentId
  name: string
  icon: typeof BookOpen
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  description: string
  schedule: string
  triggers: string[]
}

export const AGENTS: Record<AgentId, AgentConfig> = {
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge Manager',
    icon: BookOpen,
    color: 'blue',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-600',
    description: 'Manages brand knowledge base and provides material support',
    schedule: 'Real-time response + Daily cleanup at 10:00 PM',
    triggers: ['New knowledge upload', 'Material request', 'Scheduled cleanup']
  },
  planner: {
    id: 'planner',
    name: 'Content Planner',
    icon: FileText,
    color: 'purple',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-600',
    description: 'Creates content plans and analyzes requirements',
    schedule: 'Daily at 9:00 AM',
    triggers: ['Scheduled trigger', 'User request']
  },
  writer: {
    id: 'writer',
    name: 'Content Writer',
    icon: PenTool,
    color: 'orange',
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-600',
    description: 'Generates content drafts',
    schedule: 'Immediately after plan approval',
    triggers: ['Plan confirmed', 'User request']
  },
  verifier: {
    id: 'verifier',
    name: 'Quality Verifier',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-300',
    textColor: 'text-green-600',
    description: 'Checks content quality and consistency',
    schedule: 'Auto-check after draft generation',
    triggers: ['Draft completed']
  }
}

export const AGENT_STATUS_CONFIG: Record<AgentStatus, {
  label: string
  color: string
  bgColor: string
  dotColor: string
  animate?: boolean
}> = {
  active: {
    label: 'Active',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
    animate: true
  },
  idle: {
    label: 'Idle',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    dotColor: 'bg-yellow-500'
  },
  scheduled: {
    label: 'Scheduled',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    dotColor: 'bg-blue-500'
  },
  waiting: {
    label: 'Waiting',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-500'
  }
}

// Map task types to agents
export const TASK_TYPE_TO_AGENT: Record<string, AgentId> = {
  'ask_slot': 'planner',
  'generate_content': 'writer',
  'verify': 'verifier',
  'search_knowledge': 'knowledge',
  'update_knowledge': 'knowledge'
}

// Get agent by task type
export function getAgentByTaskType(taskType: string): AgentConfig {
  const agentId = TASK_TYPE_TO_AGENT[taskType] || 'planner'
  return AGENTS[agentId]
}

