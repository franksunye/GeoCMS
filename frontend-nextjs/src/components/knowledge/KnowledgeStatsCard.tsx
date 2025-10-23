'use client'

import { Knowledge } from '@/types'
import { TrendingUp, Clock, Star, Tag } from 'lucide-react'

interface KnowledgeStatsCardProps {
  knowledge: Knowledge
}

export function KnowledgeStatsCard({ knowledge }: KnowledgeStatsCardProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getQualityLabel = (score: number) => {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    if (score >= 40) return '一般'
    return '需改进'
  }

  const getTimeliness = (days: number) => {
    if (days <= 30) return { label: '最新', color: 'text-green-600' }
    if (days <= 90) return { label: '较新', color: 'text-blue-600' }
    if (days <= 180) return { label: '需更新', color: 'text-yellow-600' }
    return { label: '过期', color: 'text-red-600' }
  }

  const qualityScore = knowledge.quality_score || 0
  const referenceCount = knowledge.reference_count || 0
  const daysSinceUpdate = knowledge.days_since_update || 0
  const timeliness = getTimeliness(daysSinceUpdate)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      {/* 质量评分 */}
      <div className="flex items-center space-x-2">
        <Star className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-xs text-gray-500">质量评分</div>
          <div className={`text-lg font-semibold ${getQualityColor(qualityScore).split(' ')[0]}`}>
            {qualityScore}
            <span className="text-xs ml-1">{getQualityLabel(qualityScore)}</span>
          </div>
        </div>
      </div>

      {/* 引用次数 */}
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-xs text-gray-500">引用次数</div>
          <div className="text-lg font-semibold text-gray-900">
            {referenceCount}
          </div>
        </div>
      </div>

      {/* 更新时效 */}
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-xs text-gray-500">更新时效</div>
          <div className={`text-sm font-medium ${timeliness.color}`}>
            {timeliness.label}
            <span className="text-xs text-gray-500 ml-1">({daysSinceUpdate}天)</span>
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div className="flex items-center space-x-2">
        <Tag className="h-5 w-5 text-gray-400" />
        <div>
          <div className="text-xs text-gray-500">标签</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {knowledge.tags && knowledge.tags.length > 0 ? (
              knowledge.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">无标签</span>
            )}
            {knowledge.tags && knowledge.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{knowledge.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

