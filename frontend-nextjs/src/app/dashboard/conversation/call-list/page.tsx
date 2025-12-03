'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { PhoneCall, Clock, Tag, Gauge, Calendar, Brain, MessageSquare, ChevronDown } from 'lucide-react'
import AgentAvatar from '@/components/team/AgentAvatar'
import AgentBadge from '@/components/team/AgentBadge'
import { formatRelativeTime } from '@/lib/utils'
import { getScoreColor, getScoreBgColor, getScoreBadgeClass } from '@/lib/score-thresholds'

/**
 * 获取维度颜色（用于进度条和图标）
 */
const getDimensionIcon = (dimension: 'risk' | 'opportunity' | 'execution'): string => {
  if (dimension === 'risk') return '📍'
  if (dimension === 'opportunity') return '🎯'
  return '⚙️'
}

const getDimensionLabel = (dimension: 'risk' | 'opportunity' | 'execution'): string => {
  if (dimension === 'risk') return 'Risk'
  if (dimension === 'opportunity') return 'Opportunity'
  return 'Execution'
}

const getDimensionBarColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * 通话记录类型（UI规格定义）
 * 
= * 评分逻辑：
 * - riskScore: 风险分数（0-100）
 * - opportunityScore: 商机分数（0-100）
 * - executionScore: 执行分数（0-100）
 * - overallQualityScore: 通话总体质量分数（0-100），由上述三个维度计算得出
 */
type CallRecord = {
  id: number
  title: string
  customer_name: string
  timestamp: string
  duration_minutes: number
  riskScore: number
  opportunityScore: number
  executionScore: number
  overallQualityScore: number
  business_grade: 'High' | 'Medium' | 'Low'
  tags: string[]
  events: string[]
  behaviors: string[]
  service_issues: Array<{ tag: string; severity: 'high' | 'medium' | 'low' }>
}

export default function ConversationCallListPage() {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'analysis' | 'metadata'>('summary')
  const [expandedTagKey, setExpandedTagKey] = useState<string | null>(null)

  const { data: calls, isLoading } = useQuery<CallRecord[]>({
    queryKey: ['calls'],
    queryFn: async () => {
      const res = await axios.get('/api/calls')
      return res.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Call List</h1>
        <p className="mt-2 text-gray-600">Browse calls on the left and view details on the right</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {calls?.map((call) => (
                <div
                  key={call.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 flex items-start gap-3 ${
                    selectedCall?.id === call.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="mt-1">
                    <AgentAvatar agentId="call_analysis" size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {call.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(call.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {call.customer_name} · {call.duration_minutes} mins
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getScoreBadgeClass(call.overallQualityScore)}`}
                      >
                        Quality {call.overallQualityScore}
                      </span>
                    </div>
                    
                    {/* Dimension Scores */}
                    <div className="mt-2 space-y-1.5">
                      {/* Risk */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Risk</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getDimensionBarColor(call.riskScore)}`}
                            style={{ width: `${call.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{call.riskScore}</span>
                      </div>
                      
                      {/* Opportunity */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Opp</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getDimensionBarColor(call.opportunityScore)}`}
                            style={{ width: `${call.opportunityScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{call.opportunityScore}</span>
                      </div>
                      
                      {/* Execution */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Exec</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getDimensionBarColor(call.executionScore)}`}
                            style={{ width: `${call.executionScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{call.executionScore}</span>
                      </div>
                    </div>
                    

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call Details */}
        <div className="lg:col-span-2">
          {selectedCall ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <AgentAvatar agentId="call_analysis" size="lg" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedCall.title}
                    </h2>
                    <AgentBadge agentId="call_analysis" size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedCall.timestamp).toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>{selectedCall.duration_minutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Gauge className="h-4 w-4" />
                    <span>Score {selectedCall.overallQualityScore}/100</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Tag className="h-4 w-4" />
                    <span>{selectedCall.business_grade} intent</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex overflow-x-auto">
                  {[
                    { id: 'summary', label: 'Summary', icon: PhoneCall },
                    { id: 'transcript', label: 'Transcript', icon: PhoneCall },
                    { id: 'analysis', label: 'Analysis', icon: Gauge },
                    { id: 'metadata', label: 'Metadata', icon: Tag },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'summary' && (
                  <div className="text-gray-700 text-sm">
                    Summary content placeholder
                  </div>
                )}
                {activeTab === 'transcript' && (
                  <div className="text-gray-700 text-sm">
                    Transcript content placeholder
                  </div>
                )}
                {activeTab === 'analysis' && (
                  <div className="text-gray-700 text-sm">
                    Analysis content placeholder
                  </div>
                )}
                {activeTab === 'metadata' && (
                  <div className="space-y-6">
                    {/* Scoring */}
                    <div className={`border rounded-lg p-6 ${getScoreBgColor(selectedCall.overallQualityScore)}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Scoring</h3>
                        <div className="flex items-center gap-2">
                          <div className={`text-4xl font-bold ${getScoreColor(selectedCall.overallQualityScore)}`}>
                            {selectedCall.overallQualityScore}
                          </div>
                          <span className="text-sm text-gray-600">/100</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Risk', value: selectedCall.riskScore },
                          { label: 'Opportunity', value: selectedCall.opportunityScore },
                          { label: 'Execution', value: selectedCall.executionScore },
                          { label: 'Overall', value: selectedCall.overallQualityScore },
                        ].map((metric) => (
                          <div key={metric.label} className="bg-white rounded p-3 text-center">
                            <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                            <div className={`text-lg font-semibold ${getScoreColor(metric.value)}`}>{metric.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(() => {
                        const items = buildSignalItems(selectedCall)
                        return items.map((item, idx) => {
                          const key = `${item.tag}-${idx}`
                          const percent = item.score != null ? Math.round(item.score * 100) : null
                          return (
                            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedTagKey(expandedTagKey === key ? null : key)}
                                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${expandedTagKey === key ? 'bg-blue-50' : ''}`}
                              >
                                <div className="flex items-center gap-3 flex-1 text-left">
                                  <Tag className="h-5 w-5 text-blue-600" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-gray-900 truncate">{item.tag}</p>
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{item.dimension}</span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.polarity === 'positive' ? 'bg-green-100 text-green-800' : item.polarity === 'negative' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{item.polarity}</span>
                                      {item.severity !== 'none' && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.severity === 'high' ? 'bg-red-100 text-red-800' : item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{item.severity}</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {percent != null && <>Score {percent}</>}
                                      {item.timestamp && <> · {new Date(item.timestamp).toLocaleString('en-US')}</>}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedTagKey === key ? 'rotate-180' : ''}`} />
                              </button>

                              {expandedTagKey === key && (
                                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                                  {percent != null && (
                                    <div className={`border rounded-lg p-3 ${getScoreBgColor(percent)}`}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Score</span>
                                        <span className={`text-lg font-bold ${getScoreColor(percent)}`}>{percent}%</span>
                                      </div>
                                    </div>
                                  )}

                                  {item.context && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-blue-600" />
                                        Context
                                      </h5>
                                      <div className="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200">
                                        <p className="whitespace-pre-wrap">{item.context}</p>
                                      </div>
                                    </div>
                                  )}

                                  {item.reasoning && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-600" />
                                        Reasoning
                                      </h5>
                                      <div className="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200">
                                        <p className="whitespace-pre-wrap">{item.reasoning}</p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    {item.timestamp ? `Generated: ${new Date(item.timestamp).toLocaleString('en-US')}` : 'Generated: —'}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <PhoneCall className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Select a Call
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a call from the left list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type SignalItem = {
  tag: string
  dimension: 'Client Intent' | 'Behavior' | 'Service Issue' | 'Customer Attribute'
  polarity: 'positive' | 'neutral' | 'negative'
  severity: 'high' | 'medium' | 'low' | 'none'
  score?: number
  context?: string
  timestamp?: string | null
  reasoning?: string
}

function buildSignalItems(call: CallRecord): SignalItem[] {
  const items: SignalItem[] = []

  // Client Intent
  for (const e of call.events) {
    items.push({ tag: e, dimension: 'Client Intent', polarity: 'neutral', severity: 'none' })
  }

  // Behavior
  for (const b of call.behaviors) {
    if (b === 'listening_good') {
      items.push({
        tag: 'listening_good',
        dimension: 'Behavior',
        polarity: 'positive',
        severity: 'none',
        score: 0.8,
        context: '工程师在客户描述问题时使用“嗯”等回应，并在客户说完后才提问',
        timestamp: null,
        reasoning: '工程师在客户描述问题时给予了简短回应，没有明显打断，表现出倾听'
      })
    } else {
      items.push({ tag: b, dimension: 'Behavior', polarity: 'positive', severity: 'none' })
    }
  }

  // Service Issue (with severity required)
  for (const s of call.service_issues) {
    items.push({ tag: s.tag, dimension: 'Service Issue', polarity: 'negative', severity: s.severity })
  }

  return items
}

function getPolarityTint(p: 'positive' | 'neutral' | 'negative'): string {
  if (p === 'positive') return 'bg-green-50 border-green-200'
  if (p === 'negative') return 'bg-red-50 border-red-200'
  return 'bg-blue-50 border-blue-200'
}

function getPolarityText(p: 'positive' | 'neutral' | 'negative'): string {
  if (p === 'positive') return 'text-green-700'
  if (p === 'negative') return 'text-red-700'
  return 'text-blue-700'
}

function TagCard({ item }: { item: SignalItem }) {
  const percent = item.score != null ? Math.round(item.score * 100) : null
  return (
    <div className={`p-4 flex items-start justify-between rounded-lg border ${getPolarityTint(item.polarity)}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{item.tag}</p>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{item.dimension}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.polarity === 'positive' ? 'bg-green-100 text-green-800' : item.polarity === 'negative' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{item.polarity}</span>
          {item.severity !== 'none' && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.severity === 'high' ? 'bg-red-100 text-red-800' : item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{item.severity}</span>
          )}
        </div>
        {item.context && (
          <div className="mt-3">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Context
            </h5>
            <div className="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200">
              <p className="whitespace-pre-wrap">{item.context}</p>
            </div>
          </div>
        )}
        {item.reasoning && (
          <div className="mt-3">
            <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Reasoning
            </h5>
            <div className="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200">
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap flex-1">{item.reasoning}</p>
                {percent != null && (
                  <span className="text-xs text-gray-600 whitespace-nowrap">Score {percent}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap">
        {item.timestamp ? new Date(item.timestamp).toLocaleString('en-US') : '—'}
      </div>
    </div>
  )
}
