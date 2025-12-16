'use client'

import * as React from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CallListSortProps {
  sortBy: string
  setSortBy: (sort: 'recent' | 'score' | 'score_asc' | 'duration') => void
}

export function CallListSort({ sortBy, setSortBy }: CallListSortProps) {
  const [open, setOpen] = React.useState(false)

  const sortOptions = [
    { value: 'recent', label: '最新通话' },
    { value: 'score', label: '最高评分' },
    { value: 'score_asc', label: '最低评分' },
    { value: 'duration', label: '时长最长' },
  ] as const

  const currentLabel = sortOptions.find(opt => opt.value === sortBy)?.label || '排序'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div 
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
          role="button"
        >
          <ArrowUpDown className="h-3 w-3" />
          <span>{currentLabel}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1 bg-white border border-gray-200 shadow-xl rounded-lg" align="end">
        <div className="space-y-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSortBy(opt.value)
                setOpen(false)
              }}
              className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-colors ${
                sortBy === opt.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{opt.label}</span>
              {sortBy === opt.value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
