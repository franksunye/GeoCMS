'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import AgentAvatar from '@/components/team/AgentAvatar'
import { FilterChip } from './FilterChip'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  avatarId?: string
}

interface AgentFilterProps {
  agents: Agent[]
  value: string
  onChange: (id: string) => void
  labelPrefix?: string // e.g., "销售"
}

export function AgentFilter({
  agents,
  value,
  onChange,
  labelPrefix = "销售"
}: AgentFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const activeAgent = agents.find(a => a.id === value)

  const getLabel = () => {
    if (value === 'all') return labelPrefix
    return `${labelPrefix}: ${activeAgent?.name || value}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <FilterChip
            label={getLabel()}
            isActive={value !== 'all'}
            onClear={() => onChange('all')}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
        <div className="mb-2 px-2 py-1.5 border-b border-gray-100 flex items-center gap-2">
          <Search className="h-3 w-3 text-gray-400" />
          <input 
            className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
            placeholder={`搜索${labelPrefix}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
          <button
            onClick={() => {
              onChange('all')
              setOpen(false)
            }}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors",
              value === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">ALL</div>
            <span>所有{labelPrefix}</span>
          </button>
          {agents
            .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
            .map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                onChange(agent.id)
                setOpen(false)
              }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors",
                value === agent.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              )}
            >
              <AgentAvatar agentId={agent.avatarId || agent.id} name={agent.name} size="xs" />
              <span className="truncate">{agent.name}</span>
            </button>
          ))}
          {agents.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-500">
              未找到相关人员
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
