'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts'

interface QuartileAnalysis {
  q1: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
  q2: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
  q3: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
  q4: { range: string; avgScore: number; avgWinRate: number; sampleSize: number }
}

interface QuartileBarChartProps {
  quartileAnalysis: QuartileAnalysis
}

export default function QuartileBarChart({ quartileAnalysis }: QuartileBarChartProps) {
  const data = Object.values(quartileAnalysis).map(quartile => ({
    name: quartile.range,
    赢单率: quartile.avgWinRate,
    平均分数: quartile.avgScore,
    样本数: quartile.sampleSize,
    // 为不同分数段设置不同颜色
    fill: getColorByRange(quartile.range)
  }))

  function getColorByRange(range: string): string {
    switch (range) {
      case 'Bottom 25%': return '#ef4444' // 红色
      case '25-50%': return '#eab308'     // 黄色
      case '50-75%': return '#3b82f6'    // 蓝色
      case 'Top 25%': return '#22c55e'   // 绿色
      default: return '#6b7280'
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">赢单率: <span className="font-medium">{data.赢单率}%</span></p>
          <p className="text-sm">平均分数: <span className="font-medium">{data.平均分数}</span></p>
          <p className="text-sm">样本数: <span className="font-medium">{data.样本数}人</span></p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          domain={[0, 100]}
          label={{ value: '赢单率 (%)', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        
        <Bar 
          dataKey="赢单率" 
          radius={[0, 4, 4, 0]}
          background={{ fill: '#f3f4f6', radius: 4 }}
        >
          <LabelList 
            dataKey="赢单率" 
            position="right" 
            formatter={(value: any) => `${value}%`}
            style={{ fill: '#374151', fontSize: '12px' }}
          />
          {/* 为每个柱子设置单独的颜色 */}
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
        
        {/* 添加分数标签 */}
        {data.map((entry, index) => (
          <text
            key={`score-${index}`}
            x={-60}
            y={index * (300 / data.length) + (300 / data.length) / 2 + 20}
            textAnchor="end"
            fill="#6b7280"
            fontSize={11}
          >
            {entry.平均分数}分
          </text>
        ))}
        
        {/* 添加样本数标签 */}
        {data.map((entry, index) => (
          <text
            key={`sample-${index}`}
            x={-10}
            y={index * (300 / data.length) + (300 / data.length) / 2 + 20}
            textAnchor="end"
            fill="#9ca3af"
            fontSize={10}
          >
            {entry.样本数}人
          </text>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}