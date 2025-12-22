'use client'

import * as React from 'react'
import { Calendar, ChevronRight, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterChip } from './FilterChip'
import { TIME_PRESETS, type TimePresetValue } from '@/lib/constants/team-calls'
import { cn } from '@/lib/utils'

interface TimeFilterProps {
  value: string // current preset or custom
  onChange: (value: string, range?: { start: string; end: string }) => void
  startDate?: string
  endDate?: string
  // For Monthly Selection
  monthValue?: string // e.g., '2025-07'
  onMonthChange?: (month: string) => void
  monthOptions?: { value: string; label: string }[]
}

export function TimeFilter({
  value,
  onChange,
  startDate,
  endDate,
  monthValue,
  onMonthChange,
  monthOptions = []
}: TimeFilterProps) {
  const [open, setOpen] = React.useState(false)

  const getLabel = () => {
    if (value === 'month' && monthValue) {
      const opt = monthOptions.find(o => o.value === monthValue)
      return opt ? opt.label : monthValue
    }
    if (value === 'custom' && startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      const end = new Date(endDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      return `${start} - ${end}`
    }
    const preset = TIME_PRESETS.find(p => p.value === value)
    return preset ? preset.label : '时间范围'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <FilterChip
            label={getLabel()}
            isActive={value !== 'all' && value !== '7d'} // assuming 7d is default
            icon={<Calendar className="h-3 w-3" />}
            onClear={() => onChange('7d')}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden flex" align="start">
        {/* Left: Presets */}
        <div className="w-[120px] bg-gray-50/50 border-r border-gray-100 p-2 space-y-1">
          {TIME_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => {
                if (preset.value !== 'month' && preset.value !== 'custom') {
                  onChange(preset.value)
                  setOpen(false)
                } else {
                  onChange(preset.value)
                }
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between",
                value === preset.value 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-gray-600 hover:bg-white hover:shadow-sm"
              )}
            >
              {preset.label}
              {(preset.value === 'month' || preset.value === 'custom') && <ChevronRight className="h-3 w-3 opacity-50" />}
            </button>
          ))}
        </div>

        {/* Right: Specific Picker */}
        <div className="flex-1 p-4">
          {value === 'month' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">选择月份</h4>
              <div className="grid grid-cols-2 gap-2">
                {monthOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onMonthChange?.(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "px-2 py-2 rounded border text-xs text-center transition-all",
                      monthValue === opt.value
                        ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]"
                        : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {value === 'custom' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">选择日期范围</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">开始</label>
                  <input
                    type="date"
                    value={startDate?.split('T')[0] || ''}
                    onChange={(e) => onChange('custom', { start: e.target.value, end: endDate || '' })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">结束</label>
                  <input
                    type="date"
                    value={endDate?.split('T')[0] || ''}
                    onChange={(e) => onChange('custom', { start: startDate || '', end: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  应用范围
                </button>
              </div>
            </div>
          )}

          {value !== 'month' && value !== 'custom' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-60">
              <Calendar className="h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-500">已选择固定范围<br/>{getLabel()}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
