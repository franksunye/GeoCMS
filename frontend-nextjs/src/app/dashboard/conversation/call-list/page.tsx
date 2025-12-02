'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { PhoneCall, Clock, Tag, Gauge, Calendar } from 'lucide-react'
import AgentAvatar from '@/components/team/AgentAvatar'
import AgentBadge from '@/components/team/AgentBadge'
import { formatRelativeTime } from '@/lib/utils'

type CallRecord = {
  id: number
  title: string
  customer_name: string
  timestamp: string
  duration_minutes: number
  overall_score: number
  business_grade: 'High' | 'Medium' | 'Low'
  tags: string[]
  events: string[]
  behaviors: string[]
  service_issues: string[]
}

export default function ConversationCallListPage() {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'analysis' | 'metadata'>('summary')

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
                      {call.customer_name} · {call.duration_minutes} mins · Score {call.overall_score}/5 · {call.business_grade}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {call.tags.slice(0, 5).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {call.tags.length > 5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          +{call.tags.length - 5}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {call.events.slice(0, 3).map((e, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {e}
                        </span>
                      ))}
                      {call.behaviors.slice(0, 3).map((b, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {b}
                        </span>
                      ))}
                      {call.service_issues.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {s}
                        </span>
                      ))}
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
                    <span>Score {selectedCall.overall_score}/5</span>
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
                  <div className="text-gray-700 text-sm">
                    Metadata content placeholder
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
