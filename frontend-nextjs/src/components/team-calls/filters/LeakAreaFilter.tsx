'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LEAK_AREA_OPTIONS } from '@/lib/constants/team-calls'
import { FilterChip } from './FilterChip'

interface LeakAreaFilterProps {
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export function LeakAreaFilter({
  selectedValues,
  onChange
}: LeakAreaFilterProps) {
  const [open, setOpen] = React.useState(false)

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  const getLabel = () => {
    if (selectedValues.length === 0) return '部位'
    const selected = LEAK_AREA_OPTIONS.filter(o => selectedValues.includes(o.value))
    if (selected.length <= 2) {
      return `部位: ${selected.map(o => o.label).join(', ')}`
    }
    return `部位: ${selected[0].label}, ${selected[1].label} +${selectedValues.length - 2}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <FilterChip
            label={getLabel()}
            isActive={selectedValues.length > 0}
            onClear={() => onChange([])}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-white border border-gray-200 shadow-xl rounded-lg" align="start">
        <div className="space-y-1">
          {LEAK_AREA_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleValue(opt.value)}
              className="flex items-center w-full px-2 py-1.5 hover:bg-gray-50 rounded text-sm gap-2 transition-colors text-left"
            >
              <div className={
                `w-4 h-4 rounded border flex items-center justify-center transition-colors 
                ${selectedValues.includes(opt.value) 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300'}`
              }>
                {selectedValues.includes(opt.value) && <Check className="h-3 w-3" />}
              </div>
              <span className="text-gray-700">{opt.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
