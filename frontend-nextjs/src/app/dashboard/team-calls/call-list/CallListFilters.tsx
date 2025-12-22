'use client'

import * as React from 'react'
import { Plus, X, Search, Tag as TagIcon, Clock, ArrowUpDown, Check, Star } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import AgentAvatar from '@/components/team/AgentAvatar'
import { LeakAreaFilter } from '@/components/team-calls/filters/LeakAreaFilter'
import { AgentFilter } from '@/components/team-calls/filters/AgentFilter'
import { TimeFilter } from '@/components/team-calls/filters/TimeFilter'

interface Agent {
  id: string
  name: string
  avatarId?: string
}

interface Tag {
  id: string
  name: string
  category: string
}

interface CallListFiltersProps {
  agents: Agent[]
  tags: Tag[]
  filterAgent: string
  setFilterAgent: (id: string) => void
  filterStartDate: string
  setFilterStartDate: (date: string) => void
  filterEndDate: string
  setFilterEndDate: (date: string) => void
  filterOutcome: string[]
  setFilterOutcome: (outcomes: string[]) => void
  filterOnsite: string  // 'all' | 'onsite' | 'not_onsite'
  setFilterOnsite: (onsite: string) => void
  filterIncludeTags: string[]
  setFilterIncludeTags: (tags: string[]) => void
  filterExcludeTags: string[]
  setFilterExcludeTags: (tags: string[]) => void
  filterDuration: { min: number | null, max: number | null }
  setFilterDuration: (duration: { min: number | null, max: number | null }) => void
  filterScore: { min: number | null, max: number | null }
  setFilterScore: (score: { min: number | null, max: number | null }) => void
  filterLeakArea: string[]
  setFilterLeakArea: (leakAreas: string[]) => void
  timePreset: string
  setTimePreset: (preset: string) => void
  onClearAll: () => void
  children?: React.ReactNode
}


export function CallListFilters({
  agents,
  tags,
  filterAgent,
  setFilterAgent,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  filterOutcome,
  setFilterOutcome,
  filterOnsite,
  setFilterOnsite,
  filterIncludeTags,
  setFilterIncludeTags,
  filterExcludeTags,
  setFilterExcludeTags,
  filterDuration,
  setFilterDuration,
  filterScore,
  setFilterScore,
  filterLeakArea,
  setFilterLeakArea,
  timePreset,
  setTimePreset,
  onClearAll,
  children
}: CallListFiltersProps) {
  const [outcomeOpen, setOutcomeOpen] = React.useState(false)
  const [onsiteOpen, setOnsiteOpen] = React.useState(false)
  const [leakAreaOpen, setLeakAreaOpen] = React.useState(false)
  const [includeTagsOpen, setIncludeTagsOpen] = React.useState(false)
  const [excludeTagsOpen, setExcludeTagsOpen] = React.useState(false)
  const [durationOpen, setDurationOpen] = React.useState(false)
  const [scoreOpen, setScoreOpen] = React.useState(false)
  const [tagSearch, setTagSearch] = React.useState('')

  const hasActiveFilters = filterAgent !== 'all' || 
    filterOutcome.length > 0 || 
    filterOnsite !== 'all' ||
    filterLeakArea.length > 0 ||
    filterStartDate || 
    filterEndDate || 
    filterIncludeTags.length > 0 || 
    filterExcludeTags.length > 0 ||
    filterDuration.min !== null ||
    filterDuration.max !== null ||
    filterScore.min !== null ||
    filterScore.max !== null

  const activeAgent = agents.find(a => a.id === filterAgent)

  const outcomeOptions = [
    { value: 'won', label: '赢单' },
    { value: 'lost', label: '输单' },
    { value: 'in_progress', label: '进行中' }
  ]

  const getOutcomeLabel = () => {
    if (filterOutcome.length === 0) return '赢单状态'
    const selected = outcomeOptions.filter(o => filterOutcome.includes(o.value))
    if (selected.length <= 2) {
      return selected.map(o => o.label).join(', ')
    }
    return `${selected[0].label}, ${selected[1].label} +${filterOutcome.length - 2}`
  }

  const getTagLabel = (ids: string[], defaultText: string) => {
    if (ids.length === 0) return defaultText
    const selectedNames = ids.map(id => tags.find(t => t.id === id)?.name).filter(Boolean)
    if (selectedNames.length === 0) return defaultText
    
    if (selectedNames.length <= 2) {
      return selectedNames.join(', ')
    }
    return `${selectedNames[0]}, ${selectedNames[1]} +${ids.length - 2}`
  }

  const toggleOutcome = (value: string) => {
    if (filterOutcome.includes(value)) {
      setFilterOutcome(filterOutcome.filter(o => o !== value))
    } else {
      setFilterOutcome([...filterOutcome, value])
    }
  }

  const toggleIncludeTag = (tagId: string) => {
    if (filterIncludeTags.includes(tagId)) {
      setFilterIncludeTags(filterIncludeTags.filter(id => id !== tagId))
    } else {
      setFilterIncludeTags([...filterIncludeTags, tagId])
    }
  }

  const toggleExcludeTag = (tagId: string) => {
    if (filterExcludeTags.includes(tagId)) {
      setFilterExcludeTags(filterExcludeTags.filter(id => id !== tagId))
    } else {
      setFilterExcludeTags([...filterExcludeTags, tagId])
    }
  }



  // Common Chip Styles
  const chipBaseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap border"
  // Inactive: Light gray background, dark gray text, subtle border
  const inactiveChipClass = "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
  // Active: Gold/Amber theme to match reference but adapted for light mode (background distinct but not too heavy)
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
        <AgentFilter 
          agents={agents}
          value={filterAgent}
          onChange={setFilterAgent}
        />

        {/* --- 日期筛选 (Date Filter) --- */}
        <TimeFilter 
          value={timePreset}
          onChange={(v, range) => {
            setTimePreset(v)
            if (range) {
              setFilterStartDate(range.start)
              setFilterEndDate(range.end)
            } else if (v !== 'custom' && v !== 'month') {
              // For presets like 7d/30d, the API handles it via timeframe param usually
              // but CallList uses explicit dates.
              // Let's keep it simple: if presets are chosen, we could calculate dates
              // but usually the API handles '7d' etc.
              setFilterStartDate('') 
              setFilterEndDate('')
            }
          }}
          startDate={filterStartDate}
          endDate={filterEndDate}
        />


        {/* --- 赢单状态筛选 (Outcome Filter) --- */}
        <Popover open={outcomeOpen} onOpenChange={setOutcomeOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${filterOutcome.length > 0 ? activeChipClass : inactiveChipClass}`}>
              {filterOutcome.length > 0 ? (
                <>
                  <span>{getOutcomeLabel()}</span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterOutcome([])
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>赢单状态</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
             <div className="space-y-1">
               {[
                 { value: 'won', label: '赢单' },
                 { value: 'lost', label: '输单' },
                 { value: 'in_progress', label: '进行中' }
               ].map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => toggleOutcome(opt.value)}
                   className="flex items-center w-full px-2 py-1.5 hover:bg-gray-50 rounded text-sm gap-2 transition-colors"
                 >
                   <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterOutcome.includes(opt.value) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                     {filterOutcome.includes(opt.value) && <Check className="h-3 w-3" />}
                   </div>
                   <span className="text-gray-700">{opt.label}</span>
                 </button>
               ))}
             </div>
          </PopoverContent>
        </Popover>

        {/* --- 上门筛选 (Onsite Filter) --- */}
        <Popover open={onsiteOpen} onOpenChange={setOnsiteOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${filterOnsite !== 'all' ? activeChipClass : inactiveChipClass}`}>
              {filterOnsite !== 'all' ? (
                <>
                  <span>{filterOnsite === 'onsite' ? '已上门' : '未上门'}</span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterOnsite('all')
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>上门</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
             <div className="space-y-1">
               {[
                 { value: 'onsite', label: '已上门' },
                 { value: 'not_onsite', label: '未上门' },
               ].map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => {
                     setFilterOnsite(opt.value)
                     setOnsiteOpen(false)
                   }}
                   className={`flex items-center w-full px-2 py-1.5 hover:bg-gray-50 rounded text-sm gap-2 transition-colors ${filterOnsite === opt.value ? 'bg-blue-50 text-blue-700' : ''}`}
                 >
                   <span className="text-gray-700">{opt.label}</span>
                 </button>
               ))}
             </div>
          </PopoverContent>
        </Popover>

        {/* --- 漏水部位筛选 (Leak Area Filter) --- */}
        <LeakAreaFilter 
          selectedValues={filterLeakArea}
          onChange={setFilterLeakArea}
        />


        {/* --- 包含标签筛选 (Include Tags Filter) --- */}
        <Popover open={includeTagsOpen} onOpenChange={setIncludeTagsOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${filterIncludeTags.length > 0 ? activeChipClass : inactiveChipClass}`}>
              {filterIncludeTags.length > 0 ? (
                <>
                  <span className="max-w-[150px] truncate">{getTagLabel(filterIncludeTags, '包含标签')}</span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterIncludeTags([])
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>包含标签</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
            <div className="mb-2 px-2 py-1.5 border-b border-gray-100 flex items-center gap-2">
              <Search className="h-3 w-3 text-gray-400" />
              <input 
                className="flex-1 text-sm outline-none placeholder:text-gray-400"
                placeholder="搜索标签..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {tags
                .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                .map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleIncludeTag(tag.id)}
                  className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterIncludeTags.includes(tag.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                    {filterIncludeTags.includes(tag.id) && <X className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 truncate text-left">
                    <div className="text-gray-800">{tag.name}</div>
                    <div className="text-xs text-gray-400">{tag.category}</div>
                  </div>
                </button>
              ))}
              {tags.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-500">
                  暂无标签数据
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* --- 排除标签筛选 (Exclude Tags Filter) --- */}
        <Popover open={excludeTagsOpen} onOpenChange={setExcludeTagsOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${filterExcludeTags.length > 0 ? activeChipClass : inactiveChipClass}`}>
              {filterExcludeTags.length > 0 ? (
                <>
                  <span className="max-w-[150px] truncate">{getTagLabel(filterExcludeTags, '排除标签')}</span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterExcludeTags([])
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>排除标签</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
            <div className="mb-2 px-2 py-1.5 border-b border-gray-100 flex items-center gap-2">
              <Search className="h-3 w-3 text-gray-400" />
              <input 
                className="flex-1 text-sm outline-none placeholder:text-gray-400"
                placeholder="搜索标签..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {tags
                .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                .map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleExcludeTag(tag.id)}
                  className="w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterExcludeTags.includes(tag.id) ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300'}`}>
                     {/* 使用不同颜色表示排除 */}
                    {filterExcludeTags.includes(tag.id) && <X className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 truncate text-left">
                    <div className="text-gray-800">{tag.name}</div>
                    <div className="text-xs text-gray-400">{tag.category}</div>
                  </div>
                </button>
              ))}
              {tags.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-500">
                  暂无标签数据
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* --- 评分筛选 (Score Filter) --- */}
        <Popover open={scoreOpen} onOpenChange={setScoreOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${(filterScore.min !== null || filterScore.max !== null) ? activeChipClass : inactiveChipClass}`}>
              {(filterScore.min !== null || filterScore.max !== null) ? (
                <>
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  <span>
                    评分: {
                      filterScore.min !== null && filterScore.max !== null
                        ? `${filterScore.min}-${filterScore.max}`
                        : filterScore.min !== null
                          ? `> ${filterScore.min}`
                          : `< ${filterScore.max}`
                    }
                  </span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterScore({min: null, max: null})
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-amber-200/50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
                  <span>评分</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-900">评分范围 (0-100)</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">最低分</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    value={filterScore.min === null ? '' : filterScore.min}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null
                      setFilterScore({ ...filterScore, min: val })
                    }}
                  />
                </div>
                <div className="pt-5 text-gray-400">-</div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">最高分</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    value={filterScore.max === null ? '' : filterScore.max}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null
                      setFilterScore({ ...filterScore, max: val })
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setFilterScore({min: null, max: null})
                    setScoreOpen(false)
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清除
                </button>
                <button
                  onClick={() => setScoreOpen(false)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  应用
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* --- 时长筛选 (Duration Filter) --- */}
        <Popover open={durationOpen} onOpenChange={setDurationOpen}>
          <PopoverTrigger asChild>
            <div className={`${chipBaseClass} ${(filterDuration.min !== null || filterDuration.max !== null) ? activeChipClass : inactiveChipClass}`}>
              {(filterDuration.min !== null || filterDuration.max !== null) ? (
                <>
                  <span>
                    时长: {
                      filterDuration.min && filterDuration.max 
                        ? `${Math.floor(filterDuration.min/60)}m - ${Math.floor(filterDuration.max/60)}m`
                        : filterDuration.min 
                          ? `> ${Math.floor(filterDuration.min/60)}m`
                          : `< ${Math.floor(filterDuration.max!/60)}m`
                    }
                  </span>
                  <div 
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterDuration({min: null, max: null})
                    }}
                    className="hover:bg-amber-200/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>时长</span>
                </>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 border-b pb-2">通话时长</h4>
              
              {/* Presets */}
              <div className="space-y-1">
                {[
                  { label: '< 1 分钟', min: null, max: 60 },
                  { label: '1 - 5 分钟', min: 60, max: 300 },
                  { label: '5 - 15 分钟', min: 300, max: 900 },
                  { label: '> 15 分钟', min: 900, max: null },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFilterDuration({min: preset.min, max: preset.max})
                      setDurationOpen(false)
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors ${
                      filterDuration.min === preset.min && filterDuration.max === preset.max 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Range */}
              <div className="pt-2 border-t border-gray-100 grid gap-2">
                <div className="text-xs font-medium text-gray-500">自定义范围 (分钟)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                    value={filterDuration.min ? filterDuration.min / 60 : ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) * 60 : null
                      setFilterDuration({...filterDuration, min: val})
                    }}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                    value={filterDuration.max ? filterDuration.max / 60 : ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) * 60 : null
                      setFilterDuration({...filterDuration, max: val})
                    }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>


        {/* --- 分割线和排序 (Divider & Sort via Children) --- */}
        <div className="h-6 w-px bg-gray-200 mx-2" />
        {children}
      </div>
    </div>
  )
}
