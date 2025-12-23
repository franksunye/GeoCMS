'use client'

import { Database, LineChart, Settings2, Info, ChevronRight, Table2, RefreshCcw, ShieldCheck, FileJson } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DataSource {
  id: string
  name: string
  description: string
  tableName: string
  type: 'sync' | 'biz' | 'cfg'
  category: string
  count: number
  timeField?: string
  oldestRecord?: string | null
  latestRecord?: string | null
  error?: string
}

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/team-calls/data-sources')
        if (res.ok) {
          setDataSources(await res.json())
        }
      } catch (error) {
        console.error('Error fetching data sources:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Helper function to format date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch {
      return dateStr
    }
  }

  // Helper function to calculate days since last update
  const getDaysSinceUpdate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return null
    }
  }

  // Helper function to get freshness status (only for sync/biz layers)
  const getFreshnessStatus = (source: DataSource) => {
    if (source.type === 'cfg') return null // Config layer doesn't need freshness warnings
    
    const days = getDaysSinceUpdate(source.latestRecord)
    if (days === null) return null
    
    if (days === 0) return { label: '今天', color: 'text-emerald-600 bg-emerald-50' }
    if (days === 1) return { label: '昨天', color: 'text-emerald-600 bg-emerald-50' }
    if (days <= 7) return { label: `${days} 天前`, color: 'text-blue-600 bg-blue-50' }
    if (days <= 30) return { label: `${days} 天前`, color: 'text-amber-600 bg-amber-50' }
    return { label: `${days} 天前`, color: 'text-red-600 bg-red-50' }
  }

  const groups = [
    {
      title: '数据同步层 (Sync Layer)',
      type: 'sync',
      icon: Database,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      description: '从外部系统拉取的原始原始数据，作为分析的基础原材料。'
    },
    {
      title: '业务核心层 (Biz Layer)',
      type: 'biz',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      description: '经过清洗、ETL 处理后的结构化业务数据，直接支撑看板与报表。'
    },
    {
      title: '系统配置层 (Cfg Layer)',
      type: 'cfg',
      icon: Settings2,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      description: '定义评分标准、模型规则及 AI 逻辑的元数据配置。'
    }
  ]

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="数据源概览"
        description="统一管理与监控系统全年度的数据资产，从原始同步到业务加工的每一个环节。"
      />

      {groups.map((group) => (
        <section key={group.type} className="space-y-4">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-xl border ${group.color}`}>
              <group.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{group.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{group.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              : dataSources
                  .filter((src) => src.type === group.type)
                  .map((source) => (
                    <div
                      key={source.id}
                      className="group bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 relative overflow-hidden"
                    >
                      {/* Background accent */}
                      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] ${group.color.split(' ')[0]}`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <Table2 className="h-4 w-4 text-gray-400" />
                          <code className="text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">
                            {source.tableName}
                          </code>
                        </div>
                        {/* Freshness indicator for sync/biz layers */}
                        {getFreshnessStatus(source) && (
                          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getFreshnessStatus(source)!.color}`}>
                            {getFreshnessStatus(source)!.label}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                        {source.name}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-6 h-8 line-clamp-2">
                        {source.description}
                      </p>

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className={`text-3xl font-bold tracking-tight ${source.count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                          {source.count.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-gray-400 uppercase">记录</span>
                      </div>

                      {/* Time range information */}
                      {source.count > 0 && (source.oldestRecord || source.latestRecord) && (
                        <div className="text-[11px] text-gray-500 pb-4">
                          {source.type === 'cfg' ? (
                            // Config layer: show last update time
                            source.latestRecord && (
                              <div className="flex items-center gap-1.5">
                                <RefreshCcw className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-400">最后更新:</span>
                                <span className="font-medium text-gray-600">{formatDate(source.latestRecord)}</span>
                              </div>
                            )
                          ) : (
                            // Sync/Biz layers: show data range in one line
                            source.oldestRecord && source.latestRecord && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">数据范围:</span>
                                <span className="font-medium text-gray-600">{formatDate(source.oldestRecord)}</span>
                                <span className="text-gray-300">→</span>
                                <span className="font-medium text-gray-600">{formatDate(source.latestRecord)}</span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
          </div>
        </section>
      ))}
    </div>
  )
}
