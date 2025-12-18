'use client'

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendData {
  month: string
  avgScore: number
  winRate: number
  sampleSize: number
}

interface TrendAnalysisChartProps {
  trendData: TrendData[]
}

export default function TrendAnalysisChart({ trendData }: TrendAnalysisChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={trendData}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid stroke="#f5f5f5" vertical={false} />
        <XAxis 
          dataKey="month" 
          scale="point" 
          padding={{ left: 10, right: 10 }} 
          tick={{ fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          domain={[0, 100]} 
          label={{ value: '平均评分', angle: -90, position: 'insideLeft' }} 
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          domain={[0, 100]} 
          label={{ value: '转化率 (%)', angle: 90, position: 'insideRight' }} 
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          formatter={(value: number, name: string) => {
            if (name === '转化率') return [`${value}%`, name]
            return [value, name]
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <Bar 
          yAxisId="right" 
          dataKey="winRate" 
          name="转化率 (柱状)" 
          barSize={30} 
          fill="#3b82f6" 
          opacity={0.3} 
          radius={[4, 4, 0, 0]} 
        />
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="avgScore" 
          name="平均评分" 
          stroke="#16a34a" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} 
          activeDot={{ r: 6 }} 
        />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="winRate" 
          name="转化率 (趋势)" 
          stroke="#2563eb" 
          strokeWidth={2} 
          dot={false}
          strokeDasharray="5 5"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
