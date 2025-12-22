'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import React, { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PhoneCall, Clock, Tag, Gauge, Calendar, Brain, MessageSquare, ChevronDown, Play, Pause, RotateCcw, Volume2, MessageCircle, TrendingUp, TrendingDown, MinusCircle, Hash, Copy, Check, Target, Zap, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import AgentAvatar from '@/components/team/AgentAvatar'
import AgentBadge from '@/components/team/AgentBadge'
import { formatRelativeTime } from '@/lib/utils'
import { getScoreColor, getScoreBgColor, getScoreBadgeClass, getScoreBarColor } from '@/lib/score-thresholds'
import { MOCK_CALLS, type CallRecord, type RawSignal } from './mock-data'
import { PageHeader } from '@/components/ui/page-header'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CallListFilters } from './CallListFilters'
import { CallListSort } from './CallListSort'

/**
 * 获取维度颜色（用于进度条和图标）
 */
const getDimensionIcon = (dimension: 'process' | 'skills' | 'communication'): string => {
  if (dimension === 'process') return '⚙️'
  if (dimension === 'skills') return '🎯'
  return '💬'
}

/**
 * 获取赢单状态的徽章样式和文本
 */
const getOutcomeBadge = (businessGrade: string) => {
  if (businessGrade === 'High') {
    return {
      icon: TrendingUp,
      label: '赢单',
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      iconClassName: 'text-emerald-600'
    }
  }
  if (businessGrade === 'Low') {
    return {
      icon: TrendingDown,
      label: '输单',
      className: 'bg-rose-100 text-rose-800 border border-rose-200',
      iconClassName: 'text-rose-600'
    }
  }
  return {
    icon: MinusCircle,
    label: '进行中',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
    iconClassName: 'text-slate-500'
  }
}

/**
 * 获取上门状态的徽章样式
 */
const getOnsiteBadge = (isOnsiteCompleted?: number) => {
  if (isOnsiteCompleted === 1) {
    return {
      label: '已上门',
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
    }
  }
  return {
    label: '未上门',
    className: 'bg-gray-50 text-gray-500 border border-gray-200',
  }
}

/**
 * 获取漏水部位的标签
 */
const getLeakAreaLabels = (leakArea?: string) => {
  if (!leakArea) return []
  try {
    const codes = JSON.parse(leakArea)
    if (!Array.isArray(codes)) return []
    
    const mapping: Record<string, string> = {
      '1': '屋面',
      '2': '卫生间',
      '3': '窗户',
      '4': '外墙',
      '5': '地下室',
      '6': '其他',
      '7': '厨房'
    }
    
    return codes
      .map(code => mapping[String(code)])
      .filter((label): label is string => Boolean(label))
  } catch (e) {
    return []
  }
}

const getDimensionLabel = (dimension: 'process' | 'skills' | 'communication'): string => {
  if (dimension === 'process') return '流程规范'
  if (dimension === 'skills') return '销售技巧'
  return '沟通能力'
}

/**
 * 根据时间戳查找匹配的信号 (Raw Signals)
 * 匹配规则：信号的 timestampSec 在当前话语的时间范围内（前后2秒容差）
 */
const getSignalsForTimestamp = (
  rawSignals: RawSignal[] | undefined,
  entryTimestampSec: number
): { signalCode: string; signalName: string; reasoning: string }[] => {
  if (!rawSignals) return []
  
  const tolerance = 2 // 秒 (原5秒太大，改为2秒更精确)
  
  return rawSignals
    .filter(s => s.timestampSec !== null && Math.abs(s.timestampSec - entryTimestampSec) <= tolerance)
    .map(s => ({
      signalCode: s.signalCode,
      signalName: s.signalName,
      reasoning: s.reasoning || ''
    }))
}

/**
 * Audio Player Component for Call Recording
 */
// Define handle for parent control
export interface PlayerHandle {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
}

interface CallRecordingPlayerProps {
  callId: string | number;
  duration: number;
  audioUrl?: string;
  onTimeUpdate?: (time: number) => void;
  onIsPlayingChange?: (isPlaying: boolean) => void;
}

const CallRecordingPlayer = React.forwardRef<PlayerHandle, CallRecordingPlayerProps>(
  ({ callId, duration, audioUrl, onTimeUpdate, onIsPlayingChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [volume, setVolume] = useState(100)
    const [playbackRate, setPlaybackRate] = useState(1)
    const audioRef = useRef<HTMLAudioElement>(null)

    // Notify parent of state changes
    useEffect(() => {
      onIsPlayingChange?.(isPlaying)
    }, [isPlaying, onIsPlayingChange])

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time
        }
      },
      play: () => audioRef.current?.play(),
      pause: () => audioRef.current?.pause()
    }))

    // Sync volume
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume / 100
      }
    }, [volume])

    // Sync playback rate and keep it persistent
    // When audio src changes or metadata loads, playbackRate might reset, so we enforce it
    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      audio.playbackRate = playbackRate
      
      const enforceRate = () => { audio.playbackRate = playbackRate }
      audio.addEventListener('play', enforceRate)
      return () => audio.removeEventListener('play', enforceRate)
    }, [playbackRate])

    const handlePlayPause = () => {
      if (!audioRef.current) return
      
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(e => console.error("Play failed:", e))
      }
      setIsPlaying(!isPlaying)
    }

    const handleReset = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.pause()
      }
      setCurrentTime(0)
      setIsPlaying(false)
      onTimeUpdate?.(0)
    }

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value)
      setCurrentTime(time)
      if (audioRef.current) {
        audioRef.current.currentTime = time
      }
    }

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime
        setCurrentTime(time)
        onTimeUpdate?.(time) 
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onTimeUpdate?.(0)
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100 sticky top-4 z-10 shadow-sm">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />
        
        {/* Header - Compact */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">通话录音</h3>
            <span className="text-xs text-gray-600">
              {Math.floor(duration/60)}:{(Math.floor(duration%60)).toString().padStart(2, '0')}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${audioUrl ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
            {audioUrl ? '可播放' : '无录音'}
          </span>
        </div>

        {/* Main Controls - Single Row */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              disabled={!audioUrl}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white transition-colors shadow-sm hover:shadow ${audioUrl ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={!audioUrl}
              className="inline-flex items-center justify-center w-9 h-9 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-mono text-gray-700 min-w-[90px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            {/* Volume Control - Inline */}
            <div className="flex items-center gap-2 ml-auto">
              <Volume2 className="h-3.5 w-3.5 text-gray-600" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-20 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-gray-600 w-8 text-right">{volume}%</span>
            </div>
            
            {/* Playback Speed - Inline */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs font-medium text-gray-700">倍速:</span>
              {[0.75, 1, 1.25, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackRate(speed)}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                    playbackRate === speed 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-500'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              disabled={!audioUrl}
              className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    )
  }
)
CallRecordingPlayer.displayName = 'CallRecordingPlayer'

function CallListContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'analysis' | 'metadata'>('summary')
  const [expandedTagKey, setExpandedTagKey] = useState<string | null>(null)
  
  // Filter States - Initialize from URL if present
  const [filterAgent, setFilterAgent] = useState<string>(searchParams.get('agentId') || 'all')
  const [filterOutcome, setFilterOutcome] = useState<string[]>(
    searchParams.get('outcome') ? searchParams.get('outcome')!.split(',') : []
  )
  const [filterStartDate, setFilterStartDate] = useState<string>(searchParams.get('startDate') || '')
  const [filterEndDate, setFilterEndDate] = useState<string>(searchParams.get('endDate') || '')
  
  const [filterIncludeTags, setFilterIncludeTags] = useState<string[]>(
    searchParams.get('includeTags') ? searchParams.get('includeTags')!.split(',') : []
  )
  const [filterExcludeTags, setFilterExcludeTags] = useState<string[]>(
    searchParams.get('excludeTags') ? searchParams.get('excludeTags')!.split(',') : []
  )
  
  const [filterDuration, setFilterDuration] = useState<{min: number | null, max: number | null}>({
    min: searchParams.get('durationMin') ? Number(searchParams.get('durationMin')) : null,
    max: searchParams.get('durationMax') ? Number(searchParams.get('durationMax')) : null
  })
  
  const [filterScore, setFilterScore] = useState<{min: number | null, max: number | null}>({
    min: searchParams.get('scoreMin') ? Number(searchParams.get('scoreMin')) : null,
    max: searchParams.get('scoreMax') ? Number(searchParams.get('scoreMax')) : null
  })
  
  // Onsite Filter State
  const [filterOnsite, setFilterOnsite] = useState<string>(searchParams.get('onsite') || 'all')

  // Leak Area Filter State
  const [filterLeakArea, setFilterLeakArea] = useState<string[]>(
    searchParams.get('leakArea') ? searchParams.get('leakArea')!.split(',') : []
  )

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: 'timestamp' | 'score' | 'intent', direction: 'asc' | 'desc' }>({ 
    key: 'timestamp', 
    direction: 'desc' 
  })

  const handleSort = (key: 'timestamp' | 'score' | 'intent') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }))
  }
  
  // Link Transcript with Audio
  const playerRef = useRef<PlayerHandle>(null)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false)
  
  // Deal ID copy feedback
  const [isCopied, setIsCopied] = useState(false)

  // Reset player when switching calls
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.pause()
      playerRef.current.seekTo(0)
    }
    setCurrentPlaybackTime(0)
    setIsPlayerPlaying(false)
  }, [selectedCallId]) // Reset when call ID changes

  // Sync filters to URL and reset page
  useEffect(() => {
    setPage(1)

    // Debounce or just update URL
    const params = new URLSearchParams()
    if (filterAgent !== 'all') params.set('agentId', filterAgent)
    if (filterOutcome.length > 0) params.set('outcome', filterOutcome.join(','))
    if (filterOnsite !== 'all') params.set('onsite', filterOnsite)
    if (filterLeakArea.length > 0) params.set('leakArea', filterLeakArea.join(','))
    if (filterStartDate) params.set('startDate', filterStartDate)
    if (filterEndDate) params.set('endDate', filterEndDate)
    if (filterIncludeTags.length > 0) params.set('includeTags', filterIncludeTags.join(','))
    if (filterExcludeTags.length > 0) params.set('excludeTags', filterExcludeTags.join(','))
    if (filterDuration.min !== null) params.set('durationMin', String(filterDuration.min))
    if (filterDuration.max !== null) params.set('durationMax', String(filterDuration.max))
    if (filterScore.min !== null) params.set('scoreMin', String(filterScore.min))
    if (filterScore.max !== null) params.set('scoreMax', String(filterScore.max))
    if (sortConfig.key !== 'timestamp' || sortConfig.direction !== 'desc') {
      params.set('sort', `${sortConfig.key}_${sortConfig.direction}`)
    }

    // Shallow update
    router.replace(`?${params.toString()}`, { scroll: false })

  }, [filterAgent, filterOutcome, filterOnsite, filterStartDate, filterEndDate, filterIncludeTags, filterExcludeTags, filterDuration, filterScore, sortConfig, router])

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Page size options
  const pageSizeOptions = [10, 20, 50]

  // Helper: Check if any filter is active (for "Clear All" button)
  const hasActiveFilters = filterAgent !== 'all' || 
    filterOutcome.length > 0 || 
    filterStartDate || 
    filterEndDate || 
    filterIncludeTags.length > 0 || 
    filterExcludeTags.length > 0 ||
    filterDuration.min !== null || 
    filterDuration.max !== null

  // Helper: Clear all filters
  const clearAllFilters = () => {
    setFilterAgent('all')
    setFilterOutcome([])
    setFilterOnsite('all')
    setFilterLeakArea([])
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterIncludeTags([])
    setFilterExcludeTags([])
    setFilterDuration({min: null, max: null})
    setFilterScore({min: null, max: null})
    setPage(1)
  }

  // Outcome options with labels
  const outcomeOptions = [
    { value: 'won', label: '赢单', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' },
    { value: 'lost', label: '输单', className: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200' },
    { value: 'in_progress', label: '进行中', className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' }
  ]

  // API Response type
  interface CallsApiResponse {
    data: CallRecord[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }

  // Fetch Tags for filter
  const { data: tags = [] } = useQuery<{ id: string, name: string, category: string }[]>({
    queryKey: ['tags-config'],
    queryFn: async () => {
      const res = await fetch('/api/team-calls/config/tags')
      if (!res.ok) return []
      return res.json()
    }
  })

  // Fetch Calls
  const { data: callsResponse, isLoading, isFetching } = useQuery<CallsApiResponse>({
    queryKey: ['calls', page, pageSize, filterAgent, filterOutcome, filterOnsite, filterLeakArea, filterStartDate, filterEndDate, filterIncludeTags, filterExcludeTags, filterDuration, filterScore, sortConfig],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (filterAgent !== 'all') params.set('agentId', filterAgent)
      if (filterOutcome.length > 0) params.set('outcome', filterOutcome.join(','))
      if (filterOnsite !== 'all') params.set('onsite', filterOnsite)
      if (filterLeakArea.length > 0) params.set('leakArea', filterLeakArea.join(','))
      if (filterStartDate) params.set('startDate', filterStartDate)
      if (filterEndDate) params.set('endDate', filterEndDate)
      if (filterIncludeTags.length > 0) params.set('includeTags', filterIncludeTags.join(','))
      if (filterExcludeTags.length > 0) params.set('excludeTags', filterExcludeTags.join(','))
      if (filterDuration.min !== null) params.set('durationMin', String(filterDuration.min))
      if (filterDuration.max !== null) params.set('durationMax', String(filterDuration.max))
      if (filterScore.min !== null) params.set('scoreMin', String(filterScore.min))
      if (filterScore.max !== null) params.set('scoreMax', String(filterScore.max))
      if (sortConfig.key !== 'timestamp' || sortConfig.direction !== 'desc') {
        params.set('sort', `${sortConfig.key}_${sortConfig.direction}`)
      }
      
      const res = await fetch(`/api/team-calls/calls?${params}`)
      if (!res.ok) {
        throw new Error('Failed to fetch calls')
      }
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const calls = callsResponse?.data || []
  const pagination = callsResponse?.pagination

  // Fetch call detail when selected
  const { data: selectedCall, isLoading: isLoadingDetail } = useQuery<CallRecord>({
    queryKey: ['call-detail', selectedCallId],
    queryFn: async () => {
      if (!selectedCallId) throw new Error('No call selected')
      const res = await fetch(`/api/team-calls/calls/${selectedCallId}`)
      if (!res.ok) throw new Error('Failed to fetch call detail')
      return res.json()
    },
    enabled: !!selectedCallId
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

  // Sort calls locally (Filtering is done server-side, but score sorting must be client-side due to missing DB column)
  // Sort calls locally
  const sortedCalls = [...calls].sort((a, b) => {
    const { key, direction } = sortConfig
    const modifier = direction === 'asc' ? 1 : -1
    
    if (key === 'timestamp') {
      return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * modifier
    }
    if (key === 'score') {
      return (a.overallQualityScore - b.overallQualityScore) * modifier
    }
    if (key === 'intent') {
      const scoreA = a.predictedIntent?.score || 0
      const scoreB = b.predictedIntent?.score || 0
      return (scoreA - scoreB) * modifier
    }
    return 0
  })




  return (
    <div>
      <div className="mb-8">
        <PageHeader
          title="团队通话列表"
          description="销售团队通话表现、商机影响及辅导机会"
        />
      </div>

      <div className="space-y-6">
        {/* Calls List */}
        <div>
          {/* Filter Bar - Redesigned Component */}
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <CallListFilters
              agents={agents || []}
              tags={tags || []}
              filterAgent={filterAgent}
              setFilterAgent={setFilterAgent}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              filterOutcome={filterOutcome}
              setFilterOutcome={setFilterOutcome}
              filterOnsite={filterOnsite}
              setFilterOnsite={setFilterOnsite}
              filterLeakArea={filterLeakArea}
              setFilterLeakArea={setFilterLeakArea}
              filterIncludeTags={filterIncludeTags}
              setFilterIncludeTags={setFilterIncludeTags}
              filterExcludeTags={filterExcludeTags}
              setFilterExcludeTags={setFilterExcludeTags}
              filterDuration={filterDuration}
              setFilterDuration={setFilterDuration}
              filterScore={filterScore}
              setFilterScore={setFilterScore}
              onClearAll={clearAllFilters}
            />
          </div>

          {isLoading ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
               <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <th key={i} className="px-6 py-3 text-left">
                          <Skeleton className="h-4 w-24" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <Skeleton className="h-6 w-6 rounded-full" />
                             <Skeleton className="h-4 w-20" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="px-6 py-4">
                           <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-6 py-4">
                           <Skeleton className="h-4 w-32" />
                        </td>
                         <td className="px-6 py-4">
                           <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                         <td className="px-6 py-4 text-center">
                           <Skeleton className="h-8 w-12 mx-auto rounded" />
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex justify-end gap-2">
                             <Skeleton className="h-6 w-16 rounded" />
                             <Skeleton className="h-6 w-16 rounded-full" />
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          ) : (
          <div className={`bg-white shadow rounded-lg overflow-hidden transition-opacity duration-200 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title / Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rep
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部位
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center gap-1 group-hover:text-gray-700">
                        Date
                        {sortConfig.key === 'timestamp' && (
                           sortConfig.direction === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                      onClick={() => handleSort('intent')}
                    >
                      <div className="flex items-center gap-1 group-hover:text-gray-700">
                        Intent <Brain className="h-3 w-3" />
                        {sortConfig.key === 'intent' && (
                           sortConfig.direction === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center justify-center gap-1 group-hover:text-gray-700">
                        Score
                        {sortConfig.key === 'score' && (
                           sortConfig.direction === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上门 / 状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCalls?.map((call) => (
                    <tr 
                      key={call.id}
                      onClick={() => setSelectedCallId(String(call.id))}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedCallId === String(call.id) ? 'bg-blue-50' : ''}`}
                    >
                      {/* Title Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] lg:max-w-[300px]" title={call.title}>
                            {call.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {call.customer_name}
                          </span>
                        </div>
                      </td>

                      {/* Rep Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <AgentAvatar 
                            agentId={call.agentId || 'default-avatar'} 
                            name={call.agentName}
                            avatarUrl={call.agentAvatarId ? `https://api.dicebear.com/9.x/notionists/svg?seed=${call.agentAvatarId}&backgroundColor=e5e7eb&backgroundType=gradientLinear` : undefined}
                            size="xs" 
                          />
                          <span className="ml-2 text-sm text-gray-700">{call.agentName}</span>
                        </div>
                      </td>

                      {/* Leak Area Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {getLeakAreaLabels(call.leakArea).map((label, idx) => (
                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              {label}
                            </span>
                          ))}
                          {getLeakAreaLabels(call.leakArea).length === 0 && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>

                      {/* Duration Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.duration_minutes}m
                      </td>

                      {/* Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                      </td>

                      {/* Intent Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {call.predictedIntent ? (
                          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            call.predictedIntent.grade === 'High' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            call.predictedIntent.grade === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {call.predictedIntent.grade}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Score Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold ${getScoreBadgeClass(call.overallQualityScore)}`}>
                          {call.overallQualityScore}
                        </span>
                      </td>

                      {/* Status (Outcome + Onsite) Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {(() => {
                           const badge = getOutcomeBadge(call.business_grade)
                           const onsiteBadge = getOnsiteBadge(call.isOnsiteCompleted)
                           const Icon = badge.icon
                           return (
                             <div className="flex justify-end gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${onsiteBadge.className}`}>
                                {onsiteBadge.label}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className.replace('border', '')} ${badge.className.includes('emerald') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : badge.className.includes('rose') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <Icon className="h-3 w-3" />
                                {badge.label}
                              </span>
                             </div>
                           )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    共 {pagination.total} 条通话
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">每页显示</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1) // Reset to first page when changing page size
                      }}
                      className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size} 条</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasMore}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Call Details */}
        {/* Call Details Dialog */}
        <Dialog open={!!selectedCallId} onOpenChange={(open) => !open && setSelectedCallId(null)}>
          <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col gap-0 bg-white">
          {isLoadingDetail ? (
            <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
              {/* Header Skeleton */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1 pt-1">
                    <Skeleton className="h-7 w-1/3" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>

              {/* Player & Tabs Skeleton */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 pt-6 pb-0">
                <Skeleton className="h-14 w-full rounded-lg mb-6" />
                <div className="flex gap-6 pb-0">
                  <Skeleton className="h-9 w-24 rounded-t-lg rounded-b-none" />
                  <Skeleton className="h-9 w-24 rounded-t-lg rounded-b-none" />
                  <Skeleton className="h-9 w-24 rounded-t-lg rounded-b-none" />
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </div>
          ) : selectedCall ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <AgentAvatar agentId="call_analysis" size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCall.title}
                      </h2>
                      {/* Deal ID Badge with Copy */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(String(selectedCall.id))
                                setIsCopied(true)
                                setTimeout(() => setIsCopied(false), 2000)
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-sm font-mono border group ${
                                isCopied 
                                  ? 'bg-green-100 text-green-700 border-green-300' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-gray-200'
                              }`}
                            >
                              <Hash className={`h-3.5 w-3.5 ${isCopied ? 'text-green-500' : 'text-gray-400'}`} />
                              <span>{selectedCall.id}</span>
                              {isCopied ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isCopied ? '已复制!' : '点击复制 Deal ID'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <AgentBadge agentId="call_analysis" size="sm" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{new Date(selectedCall.timestamp).toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{selectedCall.duration_minutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Gauge className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Score {selectedCall.overallQualityScore}/100</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-700 border-l border-gray-200 pl-4 ml-2">
                     {/* 1. AI 意向 */}
                    {selectedCall.predictedIntent && (
                        <div className="flex items-center gap-2" title="意向研判">
                            <Brain className="h-4 w-4 text-gray-400" />
                            <span className={`font-medium ${
                                selectedCall.predictedIntent.grade === 'High' ? 'text-emerald-700' : 
                                selectedCall.predictedIntent.grade === 'Medium' ? 'text-amber-700' : 'text-slate-600'
                            }`}>
                               {selectedCall.predictedIntent.grade === 'High' ? 'High Intent' : 
                                selectedCall.predictedIntent.grade === 'Medium' ? 'Medium Intent' : 'Low Intent'}
                            </span>
                        </div>
                    )}
                     {/* 2. 实际结果 */}
                     {(() => {
                        const outcome = getOutcomeBadge(selectedCall.business_grade)
                        const OutcomeIcon = outcome.icon
                        return (
                             <div className="flex items-center gap-2">
                                <OutcomeIcon className={`h-4 w-4 ${outcome.iconClassName}`} />
                                <span className={`font-medium ${outcome.iconClassName}`}>
                                  {outcome.label}
                                </span>
                             </div>
                        )
                    })()}
                  </div>
                  {/* 3. 部位 (Move inside the same row) */}
                  {selectedCall.leakArea && getLeakAreaLabels(selectedCall.leakArea).length > 0 && (
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div className="flex gap-1.5">
                        {getLeakAreaLabels(selectedCall.leakArea).map((label, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-b border-gray-200 bg-gray-50">
                {/* Persistent Player */}
                <div className="px-6 pt-6 pb-2">
                    <CallRecordingPlayer 
                      ref={playerRef}
                      callId={selectedCall.id} 
                      duration={selectedCall.duration_minutes * 60} 
                      audioUrl={selectedCall.audioUrl}
                      onTimeUpdate={(t) => setCurrentPlaybackTime(t)}
                      onIsPlayingChange={setIsPlayerPlaying}
                    />
                </div>

                <div className="flex overflow-x-auto">
                  {[
                    { id: 'summary', label: '通话摘要', icon: PhoneCall },
                    { id: 'transcript', label: '逐字稿', icon: PhoneCall },
                    { id: 'analysis', label: '深度分析', icon: Gauge },
                    { id: 'metadata', label: '元数据', icon: Tag },
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
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    {/* Call Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">客户名称</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedCall.customer_name}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">通话时长</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedCall.duration_minutes} 分钟</p>
                      </div>
                      {/* AI Predicted Intent Card */}
                      {selectedCall.predictedIntent && (
                        <div className={`rounded-lg p-4 border ${
                          selectedCall.predictedIntent.grade === 'High' 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : selectedCall.predictedIntent.grade === 'Medium'
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                        }`}>
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <Brain className="h-3.5 w-3.5" /> 意向研判
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {selectedCall.predictedIntent.grade === 'High' && <Zap className="h-5 w-5 text-emerald-600" />}
                                {selectedCall.predictedIntent.grade === 'Medium' && <Target className="h-5 w-5 text-amber-600" />}
                                {selectedCall.predictedIntent.grade === 'Low' && <MinusCircle className="h-5 w-5 text-slate-500" />}
                              </span>
                              <p className={`text-lg font-bold ${
                                selectedCall.predictedIntent.grade === 'High' 
                                  ? 'text-emerald-700' 
                                  : selectedCall.predictedIntent.grade === 'Medium'
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                              }`}>
                                {selectedCall.predictedIntent.grade === 'High' ? '高意向' :
                                 selectedCall.predictedIntent.grade === 'Medium' ? '中等意向' : '低意向'}
                              </p>
                            </div>
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                              selectedCall.predictedIntent.score >= 70 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : selectedCall.predictedIntent.score >= 40
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {selectedCall.predictedIntent.score}分
                            </span>
                          </div>
                          {/* Confidence indicator */}
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <span>置信度:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full" 
                                style={{ width: `${selectedCall.predictedIntent.confidence * 100}%` }}
                              />
                            </div>
                            <span>{Math.round(selectedCall.predictedIntent.confidence * 100)}%</span>
                          </div>
                        </div>
                      )}
                      {/* Actual Outcome Card */}
                      {(() => {
                        const outcome = getOutcomeBadge(selectedCall.business_grade)
                        const onsiteBadge = getOnsiteBadge(selectedCall.isOnsiteCompleted)
                        const OutcomeIcon = outcome.icon
                        return (
                          <div className={`rounded-lg p-4 border ${outcome.className}`}>
                            <p className="text-xs mb-1 opacity-80 flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" /> 实际结果
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <OutcomeIcon className={`h-5 w-5 ${outcome.iconClassName}`} />
                                <p className="text-lg font-bold">{outcome.label}</p>
                              </div>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${onsiteBadge.className}`}>
                                {onsiteBadge.label}
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Intent Factors (if available) */}
                    {selectedCall.predictedIntent && (selectedCall.predictedIntent.factors.positive.length > 0 || selectedCall.predictedIntent.factors.negative.length > 0) && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-gray-500" /> 意向分析因素
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedCall.predictedIntent.factors.positive.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> 正向因素
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCall.predictedIntent.factors.positive.map((factor, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedCall.predictedIntent.factors.negative.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-rose-500" /> 负向因素
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCall.predictedIntent.factors.negative.map((factor, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sales Scores Overview */}
                    <div className={`border rounded-lg p-6 ${getScoreBgColor(selectedCall.overallQualityScore)}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">销售评分概览</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Process', value: selectedCall.processScore },
                          { label: 'Skills', value: selectedCall.skillsScore },
                          { label: 'Communication', value: selectedCall.communicationScore },
                          { label: 'Sales Score', value: selectedCall.overallQualityScore },
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
                        <h3 className="text-lg font-semibold text-gray-900">通话逐字稿</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedCall.transcript.length} 条对话 · {selectedCall.duration_minutes} 分钟</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Transcript Entries */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      <TooltipProvider>
                        {selectedCall.transcript.map((entry, idx) => {
                          // 查找匹配当前时间戳的原始信号
                          const matchedSignals = getSignalsForTimestamp(
                            selectedCall.rawSignals,
                            entry.timestamp
                          )

                          // Check if this entry is currently being played
                          // Logic: currentTime >= entry.start && currentTime < nextEntry.start
                          // If it's the last entry, just check >= start
                          const nextEntry = selectedCall.transcript[idx + 1]
                          const isCurrent = currentPlaybackTime >= entry.timestamp && 
                            (!nextEntry || currentPlaybackTime < nextEntry.timestamp)
                          
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (playerRef.current) {
                                  playerRef.current.seekTo(entry.timestamp)
                                  playerRef.current.play()
                                }
                              }}
                              className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors border-l-4 ${
                                isCurrent 
                                  ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-100 shadow-sm' 
                                  : entry.speaker === 'agent'
                                    ? 'bg-blue-50 border-blue-200 border-l-blue-400 hover:bg-blue-100'
                                    : 'bg-gray-50 border-gray-200 border-l-gray-400 hover:bg-gray-100'
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
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {entry.speaker === 'agent' ? (selectedCall.agentName || '销售') : '客户'}
                                    </span>
                                    {/* Signal Badges */}
                                    {matchedSignals.map((sig, sigIdx) => (
                                      <Tooltip key={sigIdx}>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 cursor-help border border-amber-200">
                                            {sig.signalName}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm bg-amber-50 text-amber-900 border border-amber-200">
                                          <div className="flex items-start gap-1.5">
                                            <Brain className="h-3 w-3 mt-0.5 text-amber-400 flex-shrink-0" />
                                            <p className="text-xs">{sig.reasoning || '暂无说明'}</p>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {Math.floor(entry.timestamp / 60)}:{(entry.timestamp % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 break-words">{entry.text}</p>
                              </div>
                            </div>
                          )
                        })}
                      </TooltipProvider>
                    </div>

                    {/* Transcript Stats */}
                    <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">总对话数</p>
                        <p className="text-lg font-semibold text-blue-600">{selectedCall.transcript.length}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">销售对话</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedCall.transcript.filter(e => e.speaker === 'agent').length}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">客户对话</p>
                        <p className="text-lg font-semibold text-gray-600">
                          {selectedCall.transcript.filter(e => e.speaker === 'customer').length}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">平均单句时长</p>
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
                        <h3 className="text-lg font-semibold text-gray-900">评分详情</h3>
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
                                      {item.category && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{item.category}</span>
                                      )}
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

                                  {/* Context Events List (Directly from Tag) */}
                                  {(() => {
                                    let events: any[] = []
                                    // Robust Parsing Logic
                                    try {
                                      let raw = item.contextEvents
                                      if (raw) {
                                        // 1. Initial parse / check
                                        if (typeof raw === 'string') {
                                          try {
                                            events = JSON.parse(raw)
                                          } catch { /* ignore */ }
                                        } else if (typeof raw === 'object') {
                                          events = raw
                                        }

                                        // 2. Handle double-stringified JSON (common in ETL pipelines)
                                        if (typeof events === 'string') {
                                           try {
                                             events = JSON.parse(events)
                                           } catch { /* ignore */ }
                                        }

                                        // 3. Ensure it's an array
                                        if (!Array.isArray(events)) {
                                          events = []
                                        }
                                      }
                                    } catch (e) {
                                      console.error('Failed to parse contextEvents', e)
                                    }
                                    
                                    // Debug: Force show raw data type
                                    /*
                                    return (
                                      <div className="text-xs border p-2 mb-2 bg-yellow-50 text-gray-500 font-mono break-all">
                                        DEBUG: HasEvents={item.contextEvents ? 'YES' : 'NO'} <br/>
                                        Type={typeof item.contextEvents} <br/>
                                        RawLength={item.contextEvents?.length} <br/>
                                        ParsedEvents={events.length} <br/>
                                        Value={String(item.contextEvents).substring(0, 50)}...
                                      </div>
                                    )
                                    */
                                    
                                    if (events.length > 0) {
                                      return (
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="h-4 w-4 text-blue-600" />
                                            <h5 className="text-sm font-semibold text-gray-900">
                                              相关对话片段 (Context Events)
                                              {/* Debug count */}
                                              <span className="text-xs text-gray-400 font-normal ml-2">({events.length} items)</span>
                                            </h5>
                                          </div>
                                          {events.map((ctx, idx) => {
                                            // Ensure conversion to number
                                            const ts = Number(ctx.timestamp_sec)
                                            const hasTimestamp = !isNaN(ts) && ts > 0
                                            
                                            // Fallback for text extraction
                                            const text = ctx.context_text || ctx.text || (typeof ctx === 'string' ? ctx : JSON.stringify(ctx))

                                            // Check if currently playing this segment (within 10 seconds window)
                                            const isCurrentSegment = hasTimestamp && currentPlaybackTime >= ts && currentPlaybackTime < (ts + 10)
                                            // Determine visual state: playing if current segment AND player is actually playing
                                            const isVisuallyPlaying = isCurrentSegment && isPlayerPlaying

                                            return (
                                              <div 
                                                key={idx} 
                                                onClick={(e) => {
                                                  e.stopPropagation() 
                                                  if (hasTimestamp && playerRef.current) {
                                                    if (isCurrentSegment && isPlayerPlaying) {
                                                      // If currently playing this segment, pause
                                                      playerRef.current.pause()
                                                    } else {
                                                      // Otherwise seek and play
                                                      playerRef.current.seekTo(ts)
                                                      playerRef.current.play()
                                                    }
                                                  }
                                                }}
                                                className={`bg-white rounded border p-3 text-sm transition-all duration-300 ${
                                                  isCurrentSegment 
                                                    ? 'border-blue-400 ring-1 ring-blue-100 shadow-md transform scale-[1.01]' 
                                                    : 'border-gray-200 shadow-sm'
                                                } ${
                                                  hasTimestamp ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 group' : ''
                                                }`}
                                              >
                                                <div className="flex flex-col gap-1">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <p className={`whitespace-pre-wrap italic flex-1 transition-colors ${isCurrentSegment ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                                                      &quot;{text}&quot;
                                                    </p>
                                                    {hasTimestamp ? (
                                                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                                                        isCurrentSegment 
                                                          ? 'bg-blue-600 text-white opacity-100' 
                                                          : 'bg-blue-50 text-blue-500 opacity-100 group-hover:opacity-100'
                                                      }`}>
                                                        {isVisuallyPlaying ? (
                                                          <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                          </span>
                                                        ) : (
                                                          // If current segment but paused, show play icon (or pause icon if we wanted to indicate 'paused on this')
                                                          // But standard is 'play' means 'click to play'. 
                                                          // Let's us standard play icon always, but changes color.
                                                          '▶'
                                                        )}
                                                        {Math.floor(ts / 60)}:{(Math.floor(ts) % 60).toString().padStart(2, '0')}
                                                      </span>
                                                    ) : (
                                                      <span className="text-xs text-red-300">TS: {String(ctx.timestamp_sec)}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )
                                    }
                                    
                                    // Fallback for Debugging: if events is empty, show why
                                    if (item.contextEvents) {
                                        return (
                                            <div className="text-xs border p-2 bg-red-50 text-red-600">
                                                Failed to parse events. Raw: {typeof item.contextEvents}
                                            </div>
                                        )
                                    }
                                    // Fallback if no context events but has legacy scalar context
                                    if (item.context) {
                                       return (
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <MessageSquare className="h-4 w-4 text-blue-600" />
                                              <h5 className="text-sm font-semibold text-gray-900">Context</h5>
                                            </div>
                                            <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-700 shadow-sm">
                                              <p className="whitespace-pre-wrap italic">&quot;{item.context}&quot;</p>
                                            </div>
                                          </div>
                                       )
                                    }

                                    return (
                                       <div className="text-sm text-gray-400 italic p-2 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                                         未捕获相关语境
                                       </div>
                                    )
                                  })()}


                                  {/* Reasoning (Directly from Tag) */}
                                  {item.reasoning && (
                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-600" />
                                        <h5 className="text-sm font-semibold text-gray-900">
                                          AI Reasoning
                                        </h5>
                                      </div>
                                      <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-700 shadow-sm">
                                        <p className="whitespace-pre-wrap">{item.reasoning}</p>
                                      </div>
                                    </div>
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
          ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function ConversationCallListPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading...</div>}>
      <CallListContent />
    </Suspense>
  )
}

type SignalItem = {
  tag: string
  name?: string
  category?: string
  dimension: string // Changed from strict union to string to support DB values like 'Intent'
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
  contextEvents?: any
}

function buildSignalItems(call: CallRecord): SignalItem[] {
  // Use rich signals from real DB
  if (call.signals && call.signals.length > 0) {
    return call.signals.map(s => {
      // Map dimension
      // Map dimension from DB or normalize
      let dim: string = s.dimension || 'Unknown'
      
      // Optional: Normalize known sales dimensions if they come in complex formats (e.g. "Sales.Process")
      if (dim.includes('Process')) dim = 'Process'
      else if (dim.includes('Communication')) dim = 'Communication'
      else if (dim.includes('Skills') || dim.includes('Sales.Skills')) dim = 'Skills'
      else if (dim.includes('Customer') && dim !== 'Intent') dim = 'Customer Attribute' 
      // otherwise keep original DB value (e.g. 'Intent', 'Service Issue')
      
      return {
        tag: s.tag,
        name: s.name,
        category: s.category,
        dimension: dim,
        polarity: (s.polarity || 'neutral') as any,
        severity: (s.severity || 'none') as any,
        score: s.score,
        context: s.context,
        timestamp: s.timestamp ? new Date(s.timestamp).toISOString() : null,
        reasoning: s.reasoning,
        is_mandatory: s.is_mandatory,
        occurrences: s.occurrences,
        contextEvents: (s as any).contextEvents
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
