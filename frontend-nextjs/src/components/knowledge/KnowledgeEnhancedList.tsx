'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Knowledge } from '@/types'
import { Search, Filter, Download, Upload, Archive, Tag as TagIcon, TrendingUp, Clock } from 'lucide-react'
import { KnowledgeStatsCard } from './KnowledgeStatsCard'
import { ListSkeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-boundary'

export function KnowledgeEnhancedList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minQuality, setMinQuality] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('updated_at')
  const [showFilters, setShowFilters] = useState(false)

  const { data: knowledge, isLoading, error, refetch } = useQuery<Knowledge[]>({
    queryKey: ['knowledge-enhanced', searchQuery, selectedTags, minQuality, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('query', searchQuery)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      if (minQuality !== null) params.append('min_quality', minQuality.toString())
      params.append('sort_by', sortBy)
      params.append('order', 'desc')

      const response = await axios.get(`/api/knowledge/enhanced?${params.toString()}`)
      return response.data
    },
    retry: 2,
    staleTime: 30000, // 30秒内认为数据是新鲜的
  })

  const { data: topKnowledge } = useQuery<Knowledge[]>({
    queryKey: ['knowledge-top'],
    queryFn: async () => {
      const response = await axios.get('/api/knowledge/top?limit=5')
      return response.data
    },
  })

  const { data: outdatedKnowledge } = useQuery<Knowledge[]>({
    queryKey: ['knowledge-outdated'],
    queryFn: async () => {
      const response = await axios.get('/api/knowledge/outdated?days=90')
      return response.data
    },
  })

  const getQualityBadge = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'bg-green-100 text-green-800' }
    if (score >= 60) return { label: '良好', color: 'bg-blue-100 text-blue-800' }
    if (score >= 40) return { label: '一般', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '需改进', color: 'bg-red-100 text-red-800' }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总知识数</p>
              <p className="text-3xl font-bold text-gray-900">{knowledge?.length || 0}</p>
            </div>
            <TagIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">热门知识</p>
              <p className="text-3xl font-bold text-gray-900">{topKnowledge?.length || 0}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">需更新</p>
              <p className="text-3xl font-bold text-gray-900">{outdatedKnowledge?.length || 0}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索知识..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-5 w-5" />
              过滤
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <option value="updated_at">最近更新</option>
              <option value="reference_count">引用次数</option>
              <option value="quality_score">质量评分</option>
            </select>
          </div>
        </div>

        {/* 高级过滤 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最低质量评分
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={minQuality || 0}
                  onChange={(e) => setMinQuality(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {minQuality || 0} 分以上
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 知识列表 */}
      <div className="space-y-4">
        {knowledge && knowledge.length > 0 ? (
          knowledge.map((item) => {
            const qualityBadge = getQualityBadge(item.quality_score || 0)
            return (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.topic}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {item.tags && item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${qualityBadge.color}`}>
                      {qualityBadge.label} {item.quality_score}分
                    </span>
                  </div>

                  <KnowledgeStatsCard knowledge={item} />

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div>
                      创建于 {new Date(item.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div>
                      更新于 {new Date(item.updated_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              没有找到知识
            </h3>
            <p className="text-gray-500">
              尝试调整搜索条件或添加新的知识
            </p>
          </div>
        )}
      </div>

      {/* 热门知识侧边栏（可选） */}
      {topKnowledge && topKnowledge.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            热门知识 Top 5
          </h3>
          <div className="space-y-3">
            {topKnowledge.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.topic}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {item.reference_count || 0} 次引用
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 需更新知识提醒 */}
      {outdatedKnowledge && outdatedKnowledge.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            需要更新的知识 ({outdatedKnowledge.length})
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            以下知识已超过90天未更新，建议及时更新以保持内容的时效性
          </p>
          <div className="space-y-2">
            {outdatedKnowledge.slice(0, 3).map((item) => (
              <div key={item.id} className="text-sm text-yellow-800">
                • {item.topic} - {item.days_since_update}天未更新
              </div>
            ))}
            {outdatedKnowledge.length > 3 && (
              <div className="text-sm text-yellow-700">
                还有 {outdatedKnowledge.length - 3} 个知识需要更新...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

