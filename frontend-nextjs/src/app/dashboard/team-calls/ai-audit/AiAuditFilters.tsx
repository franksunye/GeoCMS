'use client'

import * as React from 'react'
import { Plus, X, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import AgentAvatar from '@/components/team/AgentAvatar'

interface Agent {
  id: string
  name: string
  avatarId?: string
}

interface AiAuditFiltersProps {
  agents: Agent[]
  filterAgent: string
  setFilterAgent: (id: string) => void
  filterStartDate: string
  setFilterStartDate: (date: string) => void
  filterEndDate: string
  setFilterEndDate: (date: string) => void
  onClearAll: () => void
}

export function AiAuditFilters({
  agents,
  filterAgent,
  setFilterAgent,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  onClearAll
}: AiAuditFiltersProps) {
  const [agentSearch, setAgentSearch] = React.useState('')
  const [agentOpen, setAgentOpen] = React.useState(false)

  const hasActiveFilters = filterAgent !== 'all' || filterStartDate || filterEndDate

  const activeAgent = agents.find(a => a.id === filterAgent)

  // Common Chip Styles
  const chipBaseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap border"
  // Inactive: Light gray background, dark gray text, subtle border
  const inactiveChipClass = "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
  // Active: Gold/Amber theme to match reference but adapted for light mode
  const activeChipClass = "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100" 

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-bold text-gray-900">筛选条件</h3>
        {hasActiveFilters && (
          <button 
            onClick={onClearAll}
            className="text-xs text-gray-500 hover:text-gray-900 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            清除全部
          </button>
        )}
      </div>
      
      {/* Filters Container - Flex wrap for responsive layout */}
      <div className="flex flex-wrap gap-2 items-center">
        
        {/* --- 销售筛选 (Agent Filter) --- */}
        <Popover open={agentOpen} onOpenChange={setAgentOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${filterAgent !== 'all' ? activeChipClass : inactiveChipClass}`}>
              {filterAgent !== 'all' ? (
                <>
                  <span>销售: {activeAgent?.name || filterAgent}</span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterAgent('all')
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>销售</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
            <div className="mb-2 px-2 py-1.5 border-b border-gray-100 flex items-center gap-2">
              <Search className="h-3 w-3 text-gray-400" />
              <input 
                className="flex-1 text-sm outline-none placeholder:text-gray-400"
                placeholder="搜索销售..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              <button
                onClick={() => {
                  setFilterAgent('all')
                  setAgentOpen(false)
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${filterAgent === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">全</div>
                <span>所有销售</span>
              </button>
              {agents
                .filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase()))
                .map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setFilterAgent(agent.id)
                    setAgentOpen(false)
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${filterAgent === agent.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  <AgentAvatar agentId={agent.id} name={agent.name} size="xs" />
                  <span className="truncate">{agent.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* --- 日期筛选 (Date Filter) --- */}
        <Popover>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${(filterStartDate || filterEndDate) ? activeChipClass : inactiveChipClass}`}>
              {(filterStartDate || filterEndDate) ? (
                <>
                  <span>
                    {filterStartDate ? new Date(filterStartDate).toLocaleDateString('zh-CN', {month:'short', day:'numeric'}) : '开始'} 
                    {' - '}
                    {filterEndDate ? new Date(filterEndDate).toLocaleDateString('zh-CN', {month:'short', day:'numeric'}) : '结束'}
                  </span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterStartDate('')
                      setFilterEndDate('')
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>日期</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-900 border-b pb-2">选择日期范围</h4>
              <div className="flex gap-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-gray-500">开始日期</label>
                  <input
                    type="date"
                    value={filterStartDate?.split('T')[0] || ''}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-gray-500">结束日期</label>
                  <input
                    type="date"
                    value={filterEndDate?.split('T')[0] || ''}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
