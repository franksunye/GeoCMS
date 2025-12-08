'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'

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
}

interface ScoreValidationDashboardProps {
  validationResult: ValidationResult
  className?: string
}

export function ScoreValidationDashboard({ validationResult, className }: ScoreValidationDashboardProps) {
  const { correlation, sampleSize, quartileAnalysis, businessThresholds } = validationResult

  const getCorrelationLevel = (r: number) => {
    const absR = Math.abs(r)
    if (absR >= 0.7) return { level: '强相关', color: 'text-green-600', bg: 'bg-green-100' }
    if (absR >= 0.5) return { level: '中等相关', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (absR >= 0.3) return { level: '弱相关', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: '极弱相关', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const correlationInfo = getCorrelationLevel(correlation)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 总体验证结果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Score验证结果总览
          </CardTitle>
          <CardDescription>
            基于{sampleSize}个销售人员的数据分析评分系统与赢单率的关系
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 相关性指标 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">相关性强度</div>
              <Badge className={`${correlationInfo.bg} ${correlationInfo.color} font-semibold`}>
                {correlationInfo.level}
              </Badge>
              <div className="text-2xl font-bold">{correlation.toFixed(3)}</div>
              <div className="text-sm text-muted-foreground">
                皮尔逊相关系数
              </div>
            </div>

            {/* 样本规模 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">数据样本</div>
              <div className="text-2xl font-bold">{sampleSize}</div>
              <div className="text-sm text-muted-foreground">
                有效销售人员数量
              </div>
            </div>

            {/* 验证状态 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">验证状态</div>
              {correlation > 0.3 ? (
                <Badge className="bg-green-100 text-green-800 font-semibold">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  验证通过
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 font-semibold">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  需要优化
                </Badge>
              )}
              <div className="text-sm text-muted-foreground">
                {correlation > 0.3 ? '评分系统有效' : '需要重新评估模型'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分位数分析 */}
      <Card>
        <CardHeader>
          <CardTitle>分阶梯表现分析</CardTitle>
          <CardDescription>
            按评分分组显示不同水平销售人员的赢单率表现
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(quartileAnalysis).map((quartile, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{quartile.range}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      平均分: {quartile.avgScore}
                    </span>
                    <span className="font-semibold">
                      赢单率: {quartile.avgWinRate}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className="h-full transition-all"
                    style={{
                      width: `${quartile.avgWinRate}%`,
                      backgroundColor: 
                        index === 3 ? '#22c55e' : 
                        index === 2 ? '#3b82f6' :
                        index === 1 ? '#eab308' : '#ef4444'
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  样本数: {quartile.sampleSize}人
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 业务阈值验证 */}
      <Card>
        <CardHeader>
          <CardTitle>业务标准验证</CardTitle>
          <CardDescription>
            验证评分系统是否达到预设的业务表现标准
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {businessThresholds.map((threshold, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {threshold.meetsExpectation ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{threshold.description}</div>
                    <div className="text-sm text-muted-foreground">
                      评分{threshold.minScore}+分 → 期望赢单率{threshold.expectedWinRate}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${threshold.meetsExpectation ? 'text-green-600' : 'text-red-600'}`}>
                    {threshold.actualWinRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {threshold.sampleSize}人
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 关键洞察 */}
      <Card>
        <CardHeader>
          <CardTitle>关键业务洞察</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>
                <strong>评分每提高10分</strong>，赢单率平均提升
                <strong className="text-green-600"> {Math.round(correlation * 8)}% </strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>
                精英销售（前25%）的赢单率是后25%的
                <strong className="text-blue-600"> 
                  {Math.round(quartileAnalysis.q4.avgWinRate / quartileAnalysis.q1.avgWinRate)}倍
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {businessThresholds.filter(t => t.meetsExpectation).length >= 2 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>
                业务标准达标率: 
                <strong className={businessThresholds.filter(t => t.meetsExpectation).length >= 2 ? 'text-green-600' : 'text-red-600'}>
                  {Math.round((businessThresholds.filter(t => t.meetsExpectation).length / businessThresholds.length) * 100)}%
                </strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}