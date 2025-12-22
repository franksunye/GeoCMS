'use client'

import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  thickness?: number
  className?: string
  children?: React.ReactNode
}

export default function ProgressRing({ 
  value, 
  max = 100, 
  size = 'md', 
  thickness = 8, 
  className, 
  children 
}: ProgressRingProps) {
  const percentage = Math.min(Math.max(value, 0), max)
  const normalizedValue = (percentage / max) * 100
  
  const sizeMap = {
    sm: 80,
    md: 100,
    lg: 120
  }
  
  const radius = sizeMap[size] / 2 - thickness / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference
  
  const getRingColor = (value: number) => {
    if (value >= 80) return 'text-green-500'
    if (value >= 60) return 'text-blue-500'
    if (value >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  const ringColor = getRingColor(normalizedValue)
  
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={sizeMap[size]}
        height={sizeMap[size]}
        viewBox={`0 0 ${sizeMap[size]} ${sizeMap[size]}`}
        className="transform -rotate-90"
      >
        {/* 背景环 */}
        <circle
          cx={sizeMap[size] / 2}
          cy={sizeMap[size] / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={thickness}
          className="text-gray-200"
        />
        
        {/* 进度环 */}
        <circle
          cx={sizeMap[size] / 2}
          cy={sizeMap[size] / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', ringColor)}
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <div className="text-center">
            <div className={cn(
              'font-bold',
              size === 'sm' && 'text-lg',
              size === 'md' && 'text-xl',
              size === 'lg' && 'text-2xl'
            )}>
              {Math.round(normalizedValue)}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}