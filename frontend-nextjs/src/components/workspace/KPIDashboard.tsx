'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { KPIMetric } from '@/types'
import kpiData from '@/lib/data/kpi-metrics.json'

export function KPIDashboard() {
  const [metrics, setMetrics] = useState<KPIMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(kpiData.metrics as KPIMetric[])
      setIsLoading(false)
    }, 500)
  }, [])
  
  if (isLoading) {
    return <KPISkeleton />
  }
  
  return (
    <div className="mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard/analytics'}
            >
              View Detailed Report
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <KPICard metric={metric} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// KPI Card Component
function KPICard({ metric }: { metric: KPIMetric }) {
  const getTrendIcon = () => {
    if (!metric.trend) return null
    
    switch (metric.trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }
  
  const getTrendColor = () => {
    if (!metric.trend) return 'text-gray-500'
    
    const { direction, isGood } = metric.trend
    
    if (direction === 'stable') return 'text-gray-500'
    if (direction === 'up' && isGood) return 'text-green-600'
    if (direction === 'up' && !isGood) return 'text-red-600'
    if (direction === 'down' && isGood) return 'text-green-600'
    if (direction === 'down' && !isGood) return 'text-red-600'
    
    return 'text-gray-500'
  }
  
  const getStatusColor = () => {
    switch (metric.status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'danger':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }
  
  return (
    <Card 
      className={`p-3 ${getStatusColor()} transition-all hover:shadow-md cursor-pointer`}
      onClick={() => {
        // In production, this would navigate to detailed analytics
        console.log('Navigate to', metric.id, 'analytics')
      }}
    >
      <div className="space-y-1">
        <p className="text-xs text-gray-600 font-medium">{metric.label}</p>
        
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="text-sm text-gray-500">{metric.unit}</span>
          )}
        </div>
        
        {metric.trend && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">
              {metric.trend.percentage > 0 ? '+' : ''}
              {metric.trend.percentage}%
            </span>
          </div>
        )}
        
        {metric.target && (
          <div className="text-xs text-gray-500">
            Target: {metric.target}
          </div>
        )}
      </div>
    </Card>
  )
}

// Skeleton Component
function KPISkeleton() {
  return (
    <div className="mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

