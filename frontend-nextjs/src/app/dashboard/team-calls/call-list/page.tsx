'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PhoneCall, Clock, Tag, Gauge, Calendar, Brain, MessageSquare, ChevronDown, Play, Pause, RotateCcw, Volume2, MessageCircle } from 'lucide-react'
import AgentAvatar from '@/components/team/AgentAvatar'
import AgentBadge from '@/components/team/AgentBadge'
import { formatRelativeTime } from '@/lib/utils'
import { getScoreColor, getScoreBgColor, getScoreBadgeClass, getScoreBarColor } from '@/lib/score-thresholds'
import { MOCK_CALLS, type CallRecord } from './mock-data'

/**
 * 获取维度颜色（用于进度条和图标）
 */
const getDimensionIcon = (dimension: 'process' | 'skills' | 'communication'): string => {
  if (dimension === 'process') return '⚙️'
  if (dimension === 'skills') return '🎯'
  return '💬'
}

const getDimensionLabel = (dimension: 'process' | 'skills' | 'communication'): string => {
  if (dimension === 'process') return 'Process'
  if (dimension === 'skills') return 'Skills'
  return 'Communication'
}

/**
 * Audio Player Component for Call Recording
 */
function CallRecordingPlayer({ callId, duration, audioUrl }: { callId: string | number; duration: number; audioUrl?: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(100)
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value))
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Call Recording</h3>
          <p className="text-xs text-gray-600 mt-1">
            Total Duration: {formatTime(duration)}
          </p>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          Available
        </span>
      </div>

      {/* Player Controls */}
      <div className="space-y-4">
        {/* Play/Pause Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md hover:shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <span className="text-sm font-mono text-gray-700">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
          <Volume2 className="h-4 w-4 text-gray-600" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs text-gray-600 w-8 text-right">{volume}%</span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
          <span className="text-xs font-medium text-gray-700">Speed:</span>
          <div className="flex gap-1">
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                className="px-2 py-1 rounded bg-white border border-gray-300 hover:border-blue-500 text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recording Info */}
      <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-600">Format:</span>
          <p className="font-medium text-gray-900">MP3</p>
        </div>
        <div>
          <span className="text-gray-600">Size:</span>
          <p className="font-medium text-gray-900">12.5 MB</p>
        </div>
        <div>
          <span className="text-gray-600">Bitrate:</span>
          <p className="font-medium text-gray-900">128 kbps</p>
        </div>
        <div>
          <span className="text-gray-600">Channels:</span>
          <p className="font-medium text-gray-900">Stereo</p>
        </div>
      </div>
    </div>
  )
}

export default function ConversationCallListPage() {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'analysis' | 'metadata'>('summary')
  const [expandedTagKey, setExpandedTagKey] = useState<string | null>(null)
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'duration'>('recent')

  const { data: calls, isLoading } = useQuery<CallRecord[]>({
    queryKey: ['calls'],
    queryFn: async () => {
      const res = await fetch('/api/team-calls/calls')
      if (!res.ok) {
        throw new Error('Failed to fetch calls')
      }
      return res.json()
    }
  })

  // Fetch agents for filter
  const { data: agents } = useQuery<{ id: string, name: string }[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/team-calls/agents')
        if (res.ok) {
          return res.json()
        }
      } catch (e) {
        console.error('Failed to fetch agents:', e)
      }
      return []
    }
  })

  // Filter calls
  const filteredCalls = calls?.filter(call => {
    if (filterAgent !== 'all' && call.agentId !== filterAgent) return false
    return true
  })

  // Sort calls
  const sortedCalls = filteredCalls?.sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    }
    if (sortBy === 'score') {
      return b.overallQualityScore - a.overallQualityScore
    }
    if (sortBy === 'duration') {
      return b.duration_minutes - a.duration_minutes
    }
    return 0
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
        <h1 className="text-3xl font-bold text-gray-900">Team Calls</h1>
        <p className="mt-2 text-gray-600">Sales team call performance, pipeline impact, and coaching opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls List */}
        <div className="lg:col-span-1">
          {/* Filter Bar */}
          <div className="bg-white shadow rounded-lg p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Filter by Agent</label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Team Members</option>
                {agents?.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'score' | 'duration')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="score">Highest Score</option>
                <option value="duration">Longest Duration</option>
              </select>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {sortedCalls?.map((call) => (
                <div
                  key={call.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 flex items-start gap-3 ${
                    selectedCall?.id === call.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="mt-1">
                    <AgentAvatar 
                      agentId={call.agentId || 'default-avatar'} 
                      name={call.agentName}
                      avatarUrl={call.agentAvatarId ? `https://api.dicebear.com/9.x/notionists/svg?seed=${call.agentAvatarId}&backgroundColor=e5e7eb&backgroundType=gradientLinear` : undefined}
                      size="sm" 
                    />
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
                        Quality Score {call.overallQualityScore}
                      </span>
                      {/* Sales KPI Indicators */}
                      {call.events?.includes('customer_solution_request') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Solution Request
                        </span>
                      )}
                      {call.events?.includes('customer_schedule_request') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Demo Scheduled
                        </span>
                      )}
                      {call.service_issues?.some(s => s.severity === 'high') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          ⚠ Process Issue
                        </span>
                      )}
                    </div>
                    
                    {/* Dimension Scores */}
                    <div className="mt-2 space-y-1.5">
                      {/* Process */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Process</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreBarColor(call.processScore)}`}
                            style={{ width: `${call.processScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{call.processScore}</span>
                      </div>
                      
                      {/* Skills */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Skills</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreBarColor(call.skillsScore)}`}
                            style={{ width: `${call.skillsScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{call.skillsScore}</span>
                      </div>
                      
                      {/* Communication */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 w-12">Comm</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreBarColor(call.communicationScore)}`}
                            style={{ width: `${call.communicationScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-10 text-right">{call.communicationScore}</span>
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
                  <div className="space-y-6">
                    {/* Call Recording Player */}
                    <CallRecordingPlayer 
                      callId={selectedCall.id} 
                      duration={selectedCall.duration_minutes * 60} 
                      audioUrl={selectedCall.audioUrl}
                    />

                    {/* Call Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Customer</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedCall.customer_name}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Call Duration</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedCall.duration_minutes} minutes</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Business Grade</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedCall.business_grade}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Call Date</p>
                        <p className="text-lg font-semibold text-gray-900">{new Date(selectedCall.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Quality Scores Overview */}
                    <div className={`border rounded-lg p-6 ${getScoreBgColor(selectedCall.overallQualityScore)}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Score Overview</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Process', value: selectedCall.processScore },
                          { label: 'Skills', value: selectedCall.skillsScore },
                          { label: 'Communication', value: selectedCall.communicationScore },
                          { label: 'Overall Quality Score', value: selectedCall.overallQualityScore },
                        ].map((metric) => (
                          <div key={metric.label} className="bg-white rounded p-3 text-center">
                            <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                            <div className={`text-lg font-semibold ${getScoreColor(metric.value)}`}>{metric.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags Summary */}
                    {(selectedCall.tags.length > 0) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCall.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'transcript' && (
                  <div className="space-y-4">
                    {/* Transcript Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Call Transcript</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedCall.transcript.length} messages · {selectedCall.duration_minutes} minutes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Transcript Entries */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {selectedCall.transcript.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 p-3 rounded-lg border ${
                            entry.speaker === 'agent'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* Speaker Avatar */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                            entry.speaker === 'agent'
                              ? 'bg-blue-600'
                              : 'bg-gray-600'
                          }`}>
                            {entry.speaker === 'agent' 
                              ? (selectedCall.agentName ? selectedCall.agentName[0].toUpperCase() : 'A') 
                              : 'C'}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {entry.speaker === 'agent' ? (selectedCall.agentName || 'Agent') : 'Customer'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.floor(entry.timestamp / 60)}:{(entry.timestamp % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words">{entry.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Transcript Stats */}
                    <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Total Messages</p>
                        <p className="text-lg font-semibold text-blue-600">{selectedCall.transcript.length}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Agent Messages</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedCall.transcript.filter(e => e.speaker === 'agent').length}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Customer Messages</p>
                        <p className="text-lg font-semibold text-gray-600">
                          {selectedCall.transcript.filter(e => e.speaker === 'customer').length}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Avg Duration</p>
                        <p className="text-lg font-semibold text-gray-600">
                          {Math.round(selectedCall.duration_minutes * 60 / selectedCall.transcript.length)}s
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'analysis' && (
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
                          { label: 'Process', value: selectedCall.processScore },
                          { label: 'Skills', value: selectedCall.skillsScore },
                          { label: 'Communication', value: selectedCall.communicationScore },
                          { label: 'Overall Quality Score', value: selectedCall.overallQualityScore },
                        ].map((metric) => (
                          <div key={metric.label} className="bg-white rounded p-3 text-center">
                            <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                            <div className={`text-lg font-semibold ${getScoreColor(metric.value)}`}>{metric.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'metadata' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      {(() => {
                        const items = buildSignalItems(selectedCall)
                        return items.map((item, idx) => {
                          const key = `${item.tag}-${idx}`
                          let percent = item.score != null ? Math.round(item.score) : null
                          if (percent !== null && isNaN(percent)) percent = null
                          
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
                                      <p className="font-semibold text-gray-900 truncate">{item.name || item.tag}</p>
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{item.dimension}</span>
                                      {item.is_mandatory && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">
                                          MISSING
                                        </span>
                                      )}
                                      {!item.is_mandatory && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.polarity === 'positive' ? 'bg-green-100 text-green-800' : item.polarity === 'negative' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{item.polarity}</span>
                                      )}
                                      {item.severity !== 'none' && (
                                         <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.severity === 'high' ? 'bg-red-100 text-red-800' : item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{item.severity}</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {item.timestamp ? new Date(item.timestamp).toLocaleString('en-US') : null}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {percent != null && (
                                    <span className={`text-sm font-semibold ${getScoreColor(percent)}`}>
                                      {percent}
                                    </span>
                                  )}
                                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedTagKey === key ? 'rotate-180' : ''}`} />
                                </div>
                              </button>

                              {expandedTagKey === key && (
                                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                                  {percent != null && (
                                    <div className={`border rounded-lg p-3 ${getScoreBgColor(percent)}`}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Score</span>
                                        <span className={`text-lg font-bold ${getScoreColor(percent)}`}>{percent}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Occurrences List */}
                                  {item.occurrences && item.occurrences.length > 0 ? (
                                    <div className="space-y-4">
                                      {item.occurrences.map((occ, idx) => (
                                         <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                              <span className="text-xs font-mono text-gray-500">
                                                Instance #{idx + 1}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {occ.timestamp ? new Date(occ.timestamp).toLocaleTimeString() : '—'}
                                              </span>
                                            </div>
                                            
                                            {occ.context && (
                                              <div className="mb-2">
                                                 <h6 className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-1">
                                                   <MessageSquare className="h-3 w-3" /> Context
                                                 </h6>
                                                 <p className="text-sm text-gray-700 whitespace-pre-wrap pl-2 border-l-2 border-blue-100 italic">
                                                   "{occ.context}"
                                                 </p>
                                              </div>
                                            )}
                                            
                                            {occ.reasoning && (
                                              <div>
                                                 <h6 className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-1">
                                                   <Brain className="h-3 w-3" /> Reasoning
                                                 </h6>
                                                 <p className="text-xs text-gray-600 pl-2">
                                                   {occ.reasoning}
                                                 </p>
                                              </div>
                                            )}
                                         </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // Fallback for missing or single (legacy)
                                    <>
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
                                    </>
                                  )}
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
  name?: string
  dimension: 'Process' | 'Skills' | 'Communication' | 'Customer Attribute'
  polarity: 'positive' | 'neutral' | 'negative'
  severity: 'high' | 'medium' | 'low' | 'none'
  score?: number
  context?: string
  timestamp?: string | null
  reasoning?: string
  is_mandatory?: boolean
  occurrences?: {
    timestamp: any
    context: string
    reasoning: string
    confidence: number
  }[]
}

function buildSignalItems(call: CallRecord): SignalItem[] {
  // Use rich signals from real DB
  if (call.signals && call.signals.length > 0) {
    return call.signals.map(s => {
      // Map dimension
      let dim: SignalItem['dimension'] = 'Skills'
      if (s.dimension && s.dimension.includes('Process')) dim = 'Process'
      else if (s.dimension && s.dimension.includes('Communication')) dim = 'Communication'
      else if (s.dimension && s.dimension.includes('Customer')) dim = 'Customer Attribute'
      
      return {
        tag: s.tag,
        name: s.name,
        dimension: dim,
        polarity: (s.polarity || 'neutral') as any,
        severity: (s.severity || 'none') as any,
        score: s.score,
        context: s.context,
        timestamp: s.timestamp ? new Date(s.timestamp).toISOString() : null,
        reasoning: s.reasoning,
        is_mandatory: s.is_mandatory,
        occurrences: s.occurrences
      }
    })
  }

  return []
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
  let percent = item.score != null ? Math.round(item.score) : null
  if (percent !== null && isNaN(percent)) percent = null

  return (
    <div className={`p-4 flex items-start justify-between rounded-lg border ${getPolarityTint(item.polarity)}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{item.name || item.tag}</p>
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
