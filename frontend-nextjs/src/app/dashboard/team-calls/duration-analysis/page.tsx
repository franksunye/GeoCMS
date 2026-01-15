'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ComposedChart, ReferenceLine, Cell
} from 'recharts'
import { PageHeader } from '@/components/ui/page-header'
import { TimeFilter } from '@/components/team-calls/filters/TimeFilter'
import { 
  Clock, Target, AlertTriangle, TrendingUp, Loader2, 
  Info, ArrowUpRight, CheckCircle2, User
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 生成最近24个月的选项 (与 Scorecard 一致)
const generateMonthOptions = () => {
  const options = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
    options.push({ value, label })
  }
  return options
}

const MONTH_OPTIONS = generateMonthOptions()

interface Summary {
  avgDuration: number
  complianceRate: number
  frictionRate: number
  predictedGain: number
  totalCalls: number
}

interface DistributionItem {
  seconds: number
  label: string
  count: number
  onsiteRate: number
  winRate: number
}

interface AgentRanking {
  id: string
  name: string
  avgDuration: number
  onsiteRate: number
  winRate: number
  count: number
}

interface AnalysisData {
  summary: Summary
  distribution: DistributionItem[]
  agentRankings: AgentRanking[]
}

export default function DurationAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState('month')
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0]?.value || '')
  const [customRange, setCustomRange] = useState<{start?: string, end?: string}>({})

  useEffect(() => {
    fetchData()
  }, [timeFrame, selectedMonth, customRange, fetchData])

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (timeFrame === 'month' && selectedMonth) {
        params.set('timeframe', 'custom')
        const [year, month] = selectedMonth.split('-').map(Number)
        const start = new Date(year, month - 1, 1, 0, 0, 0)
        const end = new Date(year, month, 0, 23, 59, 59)
        params.set('startDate', start.toISOString())
        params.set('endDate', end.toISOString())
      } else if (timeFrame === 'custom' && customRange.start && customRange.end) {
        params.set('timeframe', 'custom')
        params.set('startDate', customRange.start)
        params.set('endDate', customRange.end)
      } else {
        params.set('timeframe', timeFrame)
      }

      const res = await fetch(`/api/team-calls/duration-analysis?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [timeFrame, selectedMonth, customRange])

  const handleTimeChange = (v: string, range?: { start: string; end: string }) => {
    setTimeFrame(v)
    if (v === 'custom' && range) {
      setCustomRange(range)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-bold text-sm mb-1">{label}</p>
          <div className="space-y-1">
            <p className="text-xs text-blue-600 flex justify-between gap-4">
              <span>通话数量:</span>
              <span className="font-medium">{payload[0].value}</span>
            </p>
            <p className="text-xs text-green-600 flex justify-between gap-4">
              <span>上门率:</span>
              <span className="font-medium">{payload[1]?.value.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-purple-600 flex justify-between gap-4">
              <span>成交率:</span>
              <span className="font-medium">{payload[2]?.value.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="通话时长因果分析"
        description="基于 150 秒科学红线的上门与成交效能评估"
        actions={
          <TimeFilter
            value={timeFrame}
            onChange={handleTimeChange}
            monthValue={selectedMonth}
            onMonthChange={setSelectedMonth}
            monthOptions={MONTH_OPTIONS}
            startDate={customRange.start}
            endDate={customRange.end}
          />
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              平均通话时长
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.avgDuration}s</div>
            <p className="text-xs text-muted-foreground mt-1 text-blue-600 font-medium">
              {data && data.summary.avgDuration > 150 
                ? `比红线多出 ${data.summary.avgDuration - 150}s` 
                : '处于黄金时长区间'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              黄金时段达标率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.complianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 text-green-600 font-medium">
              ≤ 150s 的通话占比
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              高摩擦通话率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.frictionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 text-amber-600 font-medium">
              &gt; 240s 且低效的通话
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              预计增收上门
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+{data?.summary.predictedGain}</div>
            <p className="text-xs text-muted-foreground mt-1 uppercase font-bold text-[10px] text-primary/80">
              缩短时长预计可增加上门
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>时长 - 结果关联趋势</span>
            <div className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
              <Info className="h-3 w-3" />
              150秒红线后上门率与成交率呈现明显的下降趋势
            </div>
          </CardTitle>
          <CardDescription>
            展示各时长区间下的通话量及其对应的上门与成交转化表现
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data?.distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11 }} 
                  interval={2}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#3b82f6" 
                  label={{ value: '通话量', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10b981" 
                  domain={[0, 100]}
                  label={{ value: '比率 (%)', angle: 90, position: 'insideRight', fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                
                {/* 科学红线 */}
                <ReferenceLine 
                  x="150s" 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ value: '150秒红线', position: 'top', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} 
                />

                <Bar 
                  yAxisId="left"
                  dataKey="count" 
                  name="通话量" 
                  fill="#93c5fd" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                >
                  {data?.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.seconds <= 150 ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
                
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="onsiteRate" 
                  name="上门率" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 5 }}
                />

                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="winRate" 
                  name="成交率" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights & Agent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">坐席效能分布</CardTitle>
            <CardDescription>按平均时长排序，识别“快准狠”专家与“高摩擦”学员</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 pb-2 text-muted-foreground">
                    <th className="font-medium py-3 px-2">坐席</th>
                    <th className="font-medium py-3 px-2">平均时长</th>
                    <th className="font-medium py-3 px-2">综。上门率</th>
                    <th className="font-medium py-3 px-2">综。成交率</th>
                    <th className="font-medium py-3 px-2">工单数</th>
                    <th className="font-medium py-3 px-2 text-right">诊断</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.agentRankings.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-2 flex items-center gap-2 font-medium">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                          <User className="h-3 w-3" />
                        </div>
                        {agent.name}
                      </td>
                      <td className="py-3 px-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold tabular-nums",
                          agent.avgDuration <= 150 ? "bg-green-100 text-green-700" : 
                          agent.avgDuration <= 180 ? "bg-amber-100 text-amber-700" : 
                          "bg-red-100 text-red-700"
                        )}>
                          {agent.avgDuration}s
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${agent.onsiteRate}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums font-medium">{agent.onsiteRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500" 
                              style={{ width: `${agent.winRate}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums font-medium text-purple-600">{agent.winRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground tabular-nums">{agent.count}</td>
                      <td className="py-3 px-2 text-right">
                        {agent.avgDuration <= 150 && agent.onsiteRate >= 40 ? (
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">快准狠</Badge>
                        ) : agent.avgDuration > 180 && agent.onsiteRate < 30 ? (
                          <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">高摩擦</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-base">业务执行指令 (SOP)</CardTitle>
            <CardDescription>基于因果发现的标准化动作建议</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-white rounded-lg border border-primary/10 flex gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex-shrink-0 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">150秒快速锚定</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">杜绝技术讲解，直接给方案指令，缩短通话耗时。通话每增加30s，成交率约下降5%。</p>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-primary/10 flex gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">听取示范：高效战神</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">推荐重点关注 <b>赵禾泽</b>、<b>孔祥达1</b> 的典型录音，学习其节奏控制。</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-primary/10 flex gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex-shrink-0 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">警惕专家陷阱</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">时长超过 180s 的通话中，70% 存在过度展示专业知识导致的上门驱动力不足。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
