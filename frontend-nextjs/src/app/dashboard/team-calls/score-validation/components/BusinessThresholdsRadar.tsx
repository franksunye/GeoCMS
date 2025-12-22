'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

interface BusinessThreshold {
  minScore: number
  expectedWinRate: number
  description: string
  actualWinRate: number
  sampleSize: number
  meetsExpectation: boolean
}

interface BusinessThresholdsRadarProps {
  businessThresholds: BusinessThreshold[]
}

export default function BusinessThresholdsRadar({ businessThresholds }: BusinessThresholdsRadarProps) {
  // 准备雷达图数据
  const radarData = businessThresholds.map(threshold => ({
    subject: threshold.description,
    actual: threshold.actualWinRate,
    expected: threshold.expectedWinRate,
    fullMark: 100
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const threshold = businessThresholds.find(t => t.description === data.subject)
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-semibold">{data.subject}</p>
          <p className="text-sm">
            实际转化率: <span className="font-medium">{data.actual}%</span>
          </p>
          <p className="text-sm">
            期望转化率: <span className="font-medium">{data.expected}%</span>
          </p>
          <p className="text-sm">
            差距: <span className={`font-medium ${data.actual >= data.expected ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(data.actual - data.expected)}%
            </span>
          </p>
          {threshold && (
            <p className="text-sm">
              样本数: <span className="font-medium">{threshold.sampleSize}人</span>
            </p>
          )}
          <p className="text-sm">
            状态: <span className={`font-medium ${data.actual >= data.expected ? 'text-green-600' : 'text-red-600'}`}>
              {data.actual >= data.expected ? '达标' : '未达标'}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomTick = ({ x, y, payload }: any) => {
    const data = radarData.find(d => d.subject === payload.value)
    if (!data) return <text x={x} y={y} fill="#374151" fontSize={11} textAnchor="middle">{payload.value}</text>
    
    const isPass = data.actual >= data.expected
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={0} textAnchor="middle" fill="#374151" fontSize={11}>
          {payload.value}
        </text>
        <text x={0} y={15} textAnchor="middle" fill={isPass ? '#10b981' : '#ef4444'} fontSize={12} fontWeight="bold">
          {isPass ? '✓' : '✗'}
        </text>
      </g>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart
        data={radarData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={<CustomTick />}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 10 }}
        />
        
        {/* 期望值雷达图 */}
        <Radar
          name="期望值"
          dataKey="expected"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        
        {/* 实际值雷达图 */}
        <Radar
          name="实际值"
          dataKey="actual"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.5}
          strokeWidth={2}
        />
        
        <Legend 
          wrapperStyle={{ 
            paddingTop: '10px',
            fontSize: '12px'
          }}
        />
        
        {/* 自定义Tooltip */}
        <CustomTooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}