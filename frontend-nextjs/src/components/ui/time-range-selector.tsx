'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * 默认时间预设选项
 */
export const DEFAULT_TIME_PRESETS = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: 'all', label: '全部' },
]

export type TimeRangeValue = typeof DEFAULT_TIME_PRESETS[number]['value'] | string

interface TimeRangeSelectorProps {
  /**
   * 当前选中的时间范围值
   */
  value: string
  
  /**
   * 时间范围变化回调
   */
  onChange: (value: string) => void
  
  /**
   * 自定义预设选项，不传则使用默认选项
   */
  presets?: { value: string; label: string }[]
  
  /**
   * 额外的 className
   */
  className?: string
}

/**
 * 时间范围选择器组件
 * 
 * 紧凑按钮组样式，用于筛选不同时间范围的数据
 * 
 * @example
 * ```tsx
 * <TimeRangeSelector
 *   value={timeFrame}
 *   onChange={setTimeFrame}
 * />
 * ```
 */
export function TimeRangeSelector({
  value,
  onChange,
  presets = DEFAULT_TIME_PRESETS,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-white rounded-lg border border-gray-200',
        className
      )}
    >
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === preset.value
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}
