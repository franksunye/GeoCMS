'use client'

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts'

interface ValidationResult {
  correlation: number
  sampleSize: number
  quartileAnalysis: {
    q1: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
    q2: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
    q3: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
    q4: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
  }
}

interface CorrelationScatterChartProps {
  validationResult: ValidationResult
}

export default function CorrelationScatterChart({ validationResult }: CorrelationScatterChartProps) {
  // 准备散点图数据 - 使用分位数数据
  const scatterData = Object.values(validationResult.quartileAnalysis).map(quartile => ({
    x: quartile.avgScore,
    y: quartile.avgWinRate,
    z: quartile.sampleSize,
    name: quartile.range
  }))

  // 计算趋势线数据 - 基于相关系数和数据范围
  const minScore = Math.min(...scatterData.map(d => d.x))
  const maxScore = Math.max(...scatterData.map(d => d.x))
  const minWinRate = Math.min(...scatterData.map(d => d.y))
  const maxWinRate = Math.max(...scatterData.map(d => d.y))
  
  // 使用中心点和相关系数计算趋势线
  // 这种方法可以正确反映正负相关性
  const midX = (minScore + maxScore) / 2
  const midY = (minWinRate + maxWinRate) / 2
  const rangeX = maxScore - minScore || 1 // 避免除以零
  const rangeY = maxWinRate - minWinRate || 1
  
  // 计算斜率的代理值：相关系数 * (Y范围 / X范围)
  const slope = validationResult.correlation * (rangeY / rangeX)
  
  const trendLineData = [
    { 
      x: 0, 
      y: Math.max(0, Math.min(100, midY + (0 - midX) * slope))
    },
    { 
      x: 100, 
      y: Math.max(0, Math.min(100, midY + (100 - midX) * slope))
    }
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      // 忽略没有名称的数据点（即趋势线）
      if (!data.name) return null

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">平均分数: <span className="font-medium">{data.x}</span></p>
          <p className="text-sm">转化率: <span className="font-medium">{data.y}%</span></p>
          <p className="text-sm">样本数: <span className="font-medium">{data.z}人</span></p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name="评分"
          domain={[0, 100]}
        >
          <Label value="销售评分" offset={-5} position="insideBottom" />
        </XAxis>
        <YAxis 
          type="number" 
          dataKey="y" 
          name="转化率"
          domain={[0, 100]}
          label={{ value: '转化率 (%)', angle: -90, position: 'left', offset: 0 }}
        />
        <ZAxis type="number" dataKey="z" range={[100, 500]} name="样本数" />
        <Tooltip content={<CustomTooltip />} />
        
        {/* 趋势线 */}
        <Scatter
          data={trendLineData}
          line={{ stroke: '#666', strokeWidth: 2, strokeDasharray: '5 5' }}
          shape={false}
          name="趋势线"
          legendType="none"
          isAnimationActive={false}
          activeIndex={-1}
          activeShape={false}
        />
        
        {/* 数据点 */}
        <Scatter
          data={scatterData}
          fill="#3b82f6"
          stroke="#1d4ed8"
          strokeWidth={2}
          name="数据点"
        />
        
        {/* 相关性标注 */}
        <text x="70%" y="10%" textAnchor="middle" fill="#666" fontSize={12}>
          {`相关系数: ${validationResult.correlation.toFixed(3)}`}
        </text>
      </ScatterChart>
    </ResponsiveContainer>
  )
}