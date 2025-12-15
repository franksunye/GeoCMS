'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, BarChart3, Loader2, Info } from 'lucide-react'
import CorrelationScatterChart from './components/CorrelationScatterChart'
import QuartileBarChart from './components/QuartileBarChart'
import BusinessThresholdsRadar from './components/BusinessThresholdsRadar'
import ProgressRing from './components/ProgressRing'
import TrendAnalysisChart from './components/TrendAnalysisChart'
import { PageHeader } from '@/components/ui/page-header'
import { TimeRangeSelector } from '@/components/ui/time-range-selector'

interface ValidationResult {
  correlation: number
  sampleSize: number
  quartileAnalysis: {
    q1: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
    q2: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
    q3: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
    q4: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
  }
  businessThresholds: Array<{
    minScore: number
    expectedWinRate: number
    description: string
    actualWinRate: number
    sampleSize: number
    meetsExpectation: boolean
  }>
  trendAnalysis: Array<{
    month: string
    avgScore: number
    winRate: number
    sampleSize: number
  }>
}

type TimeFrame = 'today' | 'week' | '7d' | '30d' | 'all'

export default function AnalyticsPage() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d')

  useEffect(() => {
    fetchValidationData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFrame])

  const fetchValidationData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/team-calls/scorecard/validation?timeframe=${timeFrame}`)
      if (!response.ok) {
        throw new Error('获取验证数据失败')
      }
      const data = await response.json()
      setValidationResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">{error || '无法加载验证数据'}</span>
      </div>
    )
  }

  // Calculate correlationInfo locally if validationResult is available, otherwise default
  const correlationInfo = validationResult ? (() => {
      const absR = Math.abs(validationResult.correlation)
      if (absR >= 0.7) return { level: '强相关', color: 'text-green-600', bg: 'bg-green-100' }
      if (absR >= 0.5) return { level: '中等相关', color: 'text-blue-600', bg: 'bg-blue-100' }
      if (absR >= 0.3) return { level: '弱相关', color: 'text-yellow-600', bg: 'bg-yellow-100' }
      return { level: '极弱相关', color: 'text-red-600', bg: 'bg-red-100' }
  })() : { level: 'Loading...', color: 'text-gray-600', bg: 'bg-gray-100' }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 页面标题和控制区 */}
        <PageHeader
          title="评分系统分析仪表板"
          description="实时监控评分系统与赢单率的相关性表现"
          actions={
            <div className="flex items-center gap-4">
              <TimeRangeSelector
                value={timeFrame}
                onChange={(v) => setTimeFrame(v as TimeFrame)}
              />

              {validationResult && (
                  <Badge className={correlationInfo.bg + ' ' + correlationInfo.color}>
                  {correlationInfo.level}
                  </Badge>
              )}
            </div>
          }
        />

        {loading ? (
           <div className="flex items-center justify-center min-h-96">
             <Loader2 className="h-8 w-8 animate-spin" />
             <span className="ml-2">加载分析数据中...</span>
           </div>
        ) : validationResult ? (
            <>
                {/* 核心指标卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">相关系数</CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                            <p className="text-sm">皮尔逊相关系数，衡量评分与赢单率的线性关系强度。值越接近1表示相关性越强。</p>
                            </TooltipContent>
                        </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{validationResult.correlation.toFixed(3)}</div>
                        <p className="text-xs text-muted-foreground">皮尔逊相关系数</p>
                    </CardContent>
                    </Card>

                    <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">样本规模</CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                            <p className="text-sm">用于分析的有效销售人员数量。样本量越大，分析结果越可靠。</p>
                            </TooltipContent>
                        </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{validationResult.sampleSize}</div>
                        <p className="text-xs text-muted-foreground">有效销售人员</p>
                    </CardContent>
                    </Card>

                    <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">验证状态</CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                            <p className="text-sm">评分系统有效性验证。相关系数大于0.3表示系统有效，可用于业务决策。</p>
                            </TooltipContent>
                        </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                        {validationResult.correlation > 0.3 ? '通过' : '失败'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                        {validationResult.correlation > 0.3 ? '系统有效' : '需要优化'}
                        </p>
                    </CardContent>
                    </Card>

                    <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">目标进度</CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                            <p className="text-sm">当前评分系统相对于强相关目标(0.7)的完成进度。绿色表示接近目标。</p>
                            </TooltipContent>
                        </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ProgressRing value={validationResult.correlation} max={0.7} />
                    </CardContent>
                    </Card>
                </div>

                {/* 趋势相关性图表 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                    <CardHeader>
                        <CardTitle>分数与赢单率相关性分析 (静态)</CardTitle>
                        <CardDescription>
                        基于所选时间段数据的散点分布，验证个体层面的相关性
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CorrelationScatterChart validationResult={validationResult} />
                    </CardContent>
                    </Card>

                    <Card>
                    <CardHeader>
                        <CardTitle>质量与结果趋势分析 (动态)</CardTitle>
                        <CardDescription>
                        按月监控评分提升是否带来了赢单率的同步增长
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {validationResult.trendAnalysis && validationResult.trendAnalysis.length > 0 ? (
                        <TrendAnalysisChart trendData={validationResult.trendAnalysis} />
                        ) : (
                        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                            暂无足够的历史趋势数据
                        </div>
                        )}
                    </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 分位数对比图表 */}
                    <Card>
                    <CardHeader>
                        <CardTitle>分阶梯表现对比</CardTitle>
                        <CardDescription>
                        不同分数段销售人员的平均赢单率表现
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QuartileBarChart quartileAnalysis={validationResult.quartileAnalysis} />
                    </CardContent>
                    </Card>

                    {/* 业务阈值雷达图 */}
                    <Card>
                    <CardHeader>
                        <CardTitle>业务标准达成情况</CardTitle>
                        <CardDescription>
                        雷达图显示各业务阈值的实际达成率与期望值对比
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BusinessThresholdsRadar businessThresholds={validationResult.businessThresholds} />
                    </CardContent>
                    </Card>
                </div>

                {/* 数据刷新控制 */}
                <div className="flex justify-end">
                    <button
                    onClick={fetchValidationData}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                    <BarChart3 className="h-4 w-4" />
                    刷新数据
                    </button>
                </div>
            </>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
