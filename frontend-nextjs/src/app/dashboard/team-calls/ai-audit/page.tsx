'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle, CheckCircle, Search, XCircle, Play, Pause, RotateCcw, Volume2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface Signal {
  id: string
  signalCode: string
  contextText: string
  timestampSec: number
  confidence: number
}

interface TagAnalysis {
  tagCode: string
  score: number
  signalCount: number
  eventCount: number
  diff: number
  status: 'ok' | 'missing_aggregation' | 'extra_aggregation'
  details: {
    signals: Signal[]
    events: any[]
  }
}

interface AuditRecord {
  id: string
  startedAt: string
  agentName: string
  duration: number
  audioUrl?: string
  signalCount: number
  tagCount: number
  totalConsistencyScore: number
  issuesCount: number
  analysis: TagAnalysis[]
}

export default function AiAuditPage() {
  const [data, setData] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null)
  
  // Audio Player State
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(100)
  const [activeSegmentTime, setActiveSegmentTime] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/team-calls/ai-audit')
      const json = await res.json()
      setData(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (score: number) => {
    if (score === 100) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 80) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getDiffBadge = (analysis: TagAnalysis) => {
    if (analysis.status === 'ok') {
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">OK</span>
    }
    if (analysis.status === 'missing_aggregation') {
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">丢失 ({analysis.diff})</span>
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">冗余 (+{Math.abs(analysis.diff)})</span>
  }

  // Audio Control Functions
  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setActiveSegmentTime(null)
    } else {
      audioRef.current.play().catch(e => console.error("Play failed:", e))
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeekTo = (seconds: number) => {
    if (audioRef.current) {
      // Check if clicking on the same segment that's currently active
      if (isPlaying && activeSegmentTime === seconds) {
        // If currently playing this segment, pause
        audioRef.current.pause()
        setIsPlaying(false)
        setActiveSegmentTime(null)
      } else {
        // Otherwise seek and play
        audioRef.current.currentTime = seconds
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
        setActiveSegmentTime(seconds)
      }
    }
  }

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.pause()
    }
    setCurrentTime(0)
    setIsPlaying(false)
    setActiveSegmentTime(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Helper to check if a timestamp is currently active (playing)
  const isCurrentlyPlaying = (seconds: number) => {
    if (!isPlaying || !seconds) return false
    return activeSegmentTime === seconds
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="AI 审计 & 调试"
        description="检查 Signal 到 Tag 聚合过程中的数据一致性与丢包情况"
        actions={
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
            刷新数据
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Call List */}
        <div className="lg:col-span-1 space-y-4">
           {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
           ) : (
             data.map(record => (
               <div 
                 key={record.id}
                 onClick={() => setSelectedRecord(record)}
                 className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRecord?.id === record.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
               >
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-gray-900">{record.agentName}</h3>
                        <p className="text-xs text-gray-500">{new Date(record.startedAt).toLocaleString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(record.totalConsistencyScore)}`}>
                        {record.totalConsistencyScore}% 一致
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Signals: {record.signalCount}</span>
                    <span>Tags: {record.tagCount}</span>
                    {record.issuesCount > 0 && (
                        <span className="flex items-center text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {record.issuesCount} 异常
                        </span>
                    )}
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Right: Detailed Audit */}
        <div className="lg:col-span-2">
            {selectedRecord ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex justify-between">
                            <span>审计详情: {selectedRecord.agentName}</span>
                            <span className="text-sm font-normal text-gray-500 font-mono">Call ID: {selectedRecord.id}</span>
                        </CardTitle>
                    </CardHeader>
                    
                    {/* Audio Player */}
                    {selectedRecord.audioUrl && (
                      <div className="px-6 pb-4">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                          <audio
                            ref={audioRef}
                            src={selectedRecord.audioUrl}
                            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                            onEnded={() => { setIsPlaying(false); setCurrentTime(0) }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            preload="metadata"
                          />
                          
                          <div className="flex items-center gap-4">
                            <button
                              onClick={handlePlayPause}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md"
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                            </button>
                            <button
                              onClick={handleReset}
                              className="inline-flex items-center justify-center w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors text-sm"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            
                            <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max={selectedRecord.duration || 100}
                                value={currentTime}
                                onChange={(e) => {
                                  const time = parseFloat(e.target.value)
                                  setCurrentTime(time)
                                  if (audioRef.current) audioRef.current.currentTime = time
                                }}
                                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                            
                            <span className="text-sm font-mono text-gray-700 min-w-[80px] text-right">
                              {formatTime(currentTime)} / {formatTime(selectedRecord.duration)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-4 w-4 text-gray-600" />
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="w-16 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2">💡 点击下方时间戳可跳转到对应音频位置</p>
                        </div>
                      </div>
                    )}
                    
                    <CardContent>
                        <div className="space-y-6">
                            {selectedRecord.analysis.map((item, idx) => (
                                <div key={idx} className={`border rounded-md p-4 ${item.status !== 'ok' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-semibold text-gray-800">{item.tagCode}</span>
                                            {getDiffBadge(item)}
                                        </div>
                                        <div className="text-xs text-gray-500 flex gap-3">
                                            <span>Expected (Signals): <b>{item.signalCount}</b></span>
                                            <span>Actual (Events): <b>{item.eventCount}</b></span>
                                        </div>
                                    </div>

                                    {/* Comparison View */}
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        {/* Raw Signals Side */}
                                        <div className="border-r pr-4 border-dashed border-gray-300">
                                            <h4 className="font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                                <Search className="w-3 h-3" /> Raw Signals (LLM Sources)
                                            </h4>
                                            {item.details.signals.length === 0 ? (
                                                <span className="text-gray-400 italic">No signals found</span>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {item.details.signals.map((s, i) => {
                                                        const isActive = isCurrentlyPlaying(s.timestampSec)
                                                        return (
                                                        <li key={i} className={`p-2 rounded border shadow-sm transition-all ${isActive ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-gray-200'}`}>
                                                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                                {s.timestampSec ? (
                                                                  <button
                                                                    onClick={() => handleSeekTo(s.timestampSec)}
                                                                    className={`font-medium cursor-pointer flex items-center gap-1 ${isActive ? 'text-blue-700' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                                                                    title={isActive ? "点击暂停" : "点击跳转到此位置"}
                                                                  >
                                                                    {isActive ? '⏸' : '▶'} {formatTime(s.timestampSec)}
                                                                  </button>
                                                                ) : (
                                                                  <span>N/A</span>
                                                                )}
                                                                <span>Confidence: {s.confidence ?? '-'}</span>
                                                            </div>
                                                            <div className={`${isActive ? 'text-blue-900 font-medium' : 'text-gray-800'}`}>&quot;{s.contextText}&quot;</div>
                                                        </li>
                                                        )
                                                    })}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Aggregated Events Side */}
                                        <div>
                                            <h4 className="font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Aggregated Context (User View)
                                            </h4>
                                            {item.details.events.length === 0 ? (
                                                <span className="text-gray-400 italic">No aggregated events</span>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {item.details.events.map((e: any, i: number) => {
                                                        const ts = typeof e === 'object' ? e.timestamp_sec : null
                                                        const isActive = ts ? isCurrentlyPlaying(ts) : false
                                                        return (
                                                        <li key={i} className={`p-2 rounded border shadow-sm transition-all ${isActive ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-gray-200'}`}>
                                                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                                {ts ? (
                                                                  <button
                                                                    onClick={() => handleSeekTo(ts)}
                                                                    className={`font-medium cursor-pointer flex items-center gap-1 ${isActive ? 'text-blue-700' : 'text-blue-600 hover:text-blue-800 hover:underline'}`}
                                                                    title={isActive ? "点击暂停" : "点击跳转到此位置"}
                                                                  >
                                                                    {isActive ? '⏸' : '▶'} {formatTime(ts)}
                                                                  </button>
                                                                ) : (
                                                                  <span>N/A</span>
                                                                )}
                                                                <span>Confidence: {typeof e === 'object' ? e.confidence : '-'}</span>
                                                            </div>
                                                            <div className={`${isActive ? 'text-blue-900 font-medium' : 'text-gray-800'}`}>
                                                                &quot;{typeof e === 'object' ? e.context_text : e}&quot;
                                                            </div>
                                                        </li>
                                                        )
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-12 text-gray-400">
                    请选择左侧通话记录以查看审计详情
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
