'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { getScoreColor, getScoreBgColor } from '@/lib/score-thresholds'
import { PageHeader } from '@/components/ui/page-header'

interface Tag {
  id: string
  code: string
  name: string
  category: string
  dimension: string
  is_mandatory?: number | boolean
}

interface Call {
  id: string
  startedAt: string
  outcome: string
  agentId: string
  agentName: string
}

interface Assessment {
  callId: string
  tagId: string
  score: number
  context_text: string
  confidence: number
}

interface ScoreDetailsData {
  tags: Tag[]
  calls: Call[]
  assessments: Record<string, Assessment>
  filters: {
    allTags: { id: string, category: string, dimension: string, name: string }[]
  }
}

export default function ScoreDetailsPage() {
  const [data, setData] = useState<ScoreDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [dimension, setDimension] = useState('all')
  const [tagName, setTagName] = useState('all')
  const [limit, setLimit] = useState('10')

  useEffect(() => {
    fetchData()
  }, [category, dimension, tagName, limit])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.append('category', category)
      if (dimension !== 'all') params.append('dimension', dimension)
      if (tagName !== 'all') params.append('tagName', tagName)
      params.append('limit', limit)

      const res = await fetch(`/api/team-calls/score-details?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch score details:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterOptions = useMemo(() => {
    if (!data?.filters?.allTags) return { categories: [], dimensions: [], tagNames: [] }
    
    const allTags = data.filters.allTags
    
    // Categories: Always all unique
    const categories = Array.from(new Set(allTags.map(t => t.category)))
    
    // Dimensions: Filter by selected category
    const dimensions = Array.from(new Set(
      allTags
        .filter(t => category === 'all' || t.category === category)
        .map(t => t.dimension)
    ))
    
    // Tag Names: Filter by selected category AND dimension
    const tagNames = Array.from(new Set(
      allTags
        .filter(t => category === 'all' || t.category === category)
        .filter(t => dimension === 'all' || t.dimension === dimension)
        .map(t => t.name)
    ))
    
    return { categories, dimensions, tagNames }
  }, [data?.filters?.allTags, category, dimension])

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setDimension('all')
    setTagName('all')
  }

  const handleDimensionChange = (val: string) => {
    setDimension(val)
    setTagName('all')
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="分数明细"
        actions={
          <div className="flex gap-4">
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                {filterOptions.categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dimension} onValueChange={handleDimensionChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择维度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有维度</SelectItem>
                {filterOptions.dimensions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagName} onValueChange={setTagName}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有Tag</SelectItem>
                {filterOptions.tagNames.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="显示数量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">最近 3 条</SelectItem>
                <SelectItem value="5">最近 5 条</SelectItem>
                <SelectItem value="10">最近 10 条</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>评分详情矩阵</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : !data || data.calls.length === 0 ? (
            <div className="text-center p-8 text-gray-500">暂无数据</div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-3 border sticky left-0 bg-gray-50 z-10 min-w-[200px]">Tag (Name / Code)</th>
                    {data.calls.map(call => (
                      <th key={call.id} colSpan={2} className="p-3 border text-center min-w-[300px]">
                        <div>{call.agentName} Call #{call.id.slice(-4)}</div>
                        <div className="text-xs font-normal text-gray-500">
                          {new Date(call.startedAt).toLocaleString()}
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="p-2 border sticky left-0 bg-gray-50 z-10"></th>
                    {data.calls.map(call => (
                      <>
                        <th key={`${call.id}-score`} className="p-2 border text-center w-[60px] bg-gray-50">Score</th>
                        <th key={`${call.id}-ctx`} className="p-2 border bg-gray-50">Context</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tags.map(tag => (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <td className="p-3 border sticky left-0 bg-white font-medium z-10">
                        <div className="flex items-center gap-2">
                          {tag.name}
                          {(tag.is_mandatory === 1 || tag.is_mandatory === true) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
                              必选
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{tag.code}</div>
                      </td>
                      {data.calls.map(call => {
                        const assessment = data.assessments[`${call.id}_${tag.id}`]
                        return (
                          <>
                            <td key={`${call.id}-${tag.id}-score`} className="p-3 border text-center align-top">
                              {assessment ? (
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${getScoreColor(assessment.score)} ${getScoreBgColor(assessment.score)}`}>
                                  {assessment.score}
                                </span>
                              ) : (tag.is_mandatory === 1 || tag.is_mandatory === true) ? (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                                  MISSING
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td key={`${call.id}-${tag.id}-ctx`} className="p-3 border align-top text-xs text-gray-600 leading-relaxed min-w-[200px] max-w-[300px]">
                              {assessment && assessment.context_text ? (
                                <div className="space-y-1.5" title={assessment.context_text}>
                                  {assessment.context_text.split(' | ').map((text: string, idx: number, arr: string[]) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      {arr.length > 1 && (
                                        <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-medium mt-0.5">
                                          {idx + 1}
                                        </span>
                                      )}
                                      <span className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-700">
                                        "{text.trim()}"
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </td>
                          </>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
