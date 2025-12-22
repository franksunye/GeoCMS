'use client'

import * as React from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string | React.ReactNode
  isActive: boolean
  onClear?: (e: React.MouseEvent) => void
  onClick?: () => void
  icon?: React.ReactNode
  showArrow?: boolean
  className?: string
}

export function FilterChip({
  label,
  isActive,
  onClear,
  onClick,
  icon = <Plus className="h-3 w-3" />,
  showArrow = true,
  className
}: FilterChipProps) {
  // Base styles
  const chipBaseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer select-none whitespace-nowrap border shadow-sm"
  
  // Inactive: Light gray background
  const inactiveChipClass = "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
  
  // Active: Amber theme for "Premium" look, matches call-list style
  const activeChipClass = "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 ring-1 ring-amber-200/50"

  return (
    <div 
      className={cn(
        chipBaseClass, 
        isActive ? activeChipClass : inactiveChipClass,
        className
      )}
      onClick={onClick}
    >
      {isActive ? (
        <>
          <div className="flex items-center gap-1.5">
            {label}
          </div>
          {onClear && (
            <div 
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onClear(e)
              }}
              className="hover:bg-amber-200/50 rounded-full p-0.5 transition-colors -mr-1"
            >
              <X className="h-3 w-3" />
            </div>
          )}
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
      {showArrow && !isActive && (
        <ChevronDown className="h-3 w-3 text-gray-400 ml-0.5" />
      )}
    </div>
  )
}
