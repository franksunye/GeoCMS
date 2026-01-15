'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Loader2, MessageCircle, Volume2, ExternalLink, Play, Pause, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { TimeFilter } from '@/components/team-calls/filters/TimeFilter'
import { LeakAreaFilter } from '@/components/team-calls/filters/LeakAreaFilter'
import { LEAK_AREA_OPTIONS } from '@/lib/constants/team-calls'

type TimeFrame = 'today' | 'week' | '7d' | '30d' | 'all' | 'custom' | 'month'

interface RankingItem {
  category: string
  count: number
  percentage: number
}

interface Sample {
  id: string
  question: string
  dealId: string
  callId: string | null
  timestamp: number | null
  audioUrl: string | null
  leakArea: string | null
  agentName: string | null
}

interface FaqStats {
  summary: {
    totalCalls: number
    totalQuestions: number
    avgQuestionsPerCall: number
  }
  ranking: RankingItem[]
}

// 生成最近24个月的选项
const generateMonthOptions = () => {
  const options = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
    options.push({ value, label })
  }
  return options
}

const MONTH_OPTIONS = generateMonthOptions()

// 分类颜色
const CATEGORY_COLORS: Record<string, string> = {
  '价格咨询': 'bg-purple-500',
  '服务范围': 'bg-blue-500', 
  '上门时间': 'bg-green-500',
  '质保期': 'bg-yellow-500',
  '服务人员': 'bg-orange-500',
  '施工流程': 'bg-pink-500',
  '联系方式': 'bg-cyan-500',
  '其他': 'bg-gray-400',
}

export default function FaqPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month')
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0]?.value || '')
  const [selectedLeakAreas, setSelectedLeakAreas] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stats, setStats] = useState<FaqStats | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSamplesLoading, setIsSamplesLoading] = useState(false)

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeSample, setActiveSample] = useState<Sample | null>(null)
  const pendingSeekRef = useRef<number | null>(null)

  const handlePlayQuestion = (sample: Sample) => {
    if (!sample.audioUrl) return

    const seekTime = sample.timestamp !== null ? sample.timestamp / 1000 : 0

    if (activeSample?.id !== sample.id) {
        // New audio source - need to load first
        setActiveSample(sample)
        pendingSeekRef.current = seekTime
        if (audioRef.current) {
            audioRef.current.src = sample.audioUrl
            audioRef.current.load()
            // Will seek and play in onCanPlay handler
        }
    } else {
        // Same audio - can seek directly
        if (audioRef.current) {
            audioRef.current.currentTime = seekTime
            audioRef.current.play().catch(console.error)
            setIsPlaying(true)
        }
    }
  }

  const handleCanPlay = () => {
    if (pendingSeekRef.current !== null && audioRef.current) {
        audioRef.current.currentTime = pendingSeekRef.current
        pendingSeekRef.current = null
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
    }
  }

  const handleClosePlayer = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
    setActiveSample(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        
        if ((timeFrame === 'month' || timeFrame === 'custom') && selectedMonth) {
          const [year, month] = selectedMonth.split('-').map(Number)
          const start = new Date(year, month - 1, 1, 0, 0, 0)
          const end = new Date(year, month, 0, 23, 59, 59)
          params.set('startDate', start.toISOString())
          params.set('endDate', end.toISOString())
        }
        
        if (selectedLeakAreas.length > 0) {
          params.set('leakArea', selectedLeakAreas.join(','))
        }
        
        const res = await fetch(`/api/team-calls/faq/stats?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          // 自动选中第一个分类
          if (data.ranking.length > 0 && !selectedCategory) {
            setSelectedCategory(data.ranking[0].category)
          }
        }
      } catch (e) {
        console.error('Error fetching FAQ stats:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [timeFrame, selectedMonth, selectedLeakAreas])

  // 获取样本数据
  useEffect(() => {
    if (!selectedCategory) return
    
    const fetchSamples = async () => {
      setIsSamplesLoading(true)
      try {
        const res = await fetch(`/api/team-calls/faq/samples?category=${encodeURIComponent(selectedCategory)}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          setSamples(data.samples)
        }
      } catch (e) {
        console.error('Error fetching FAQ samples:', e)
      } finally {
        setIsSamplesLoading(false)
      }
    }
    fetchSamples()
  }, [selectedCategory])

  // 计算最大值用于条形图
  const maxCount = useMemo(() => {
    if (!stats?.ranking.length) return 1
    return Math.max(...stats.ranking.map(r => r.count))
  }, [stats])

  const getLeakAreaName = (leakAreaJson: string | null) => {
    if (!leakAreaJson) return null
    try {
      const areas = JSON.parse(leakAreaJson)
      const firstArea = areas[0]
      const option = LEAK_AREA_OPTIONS.find(o => o.value === firstArea)
      return option?.label || firstArea
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="客户问题分析"
        description="从通话中提取的客户常见问题排行榜"
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <TimeFilter
          value={timeFrame}
          onChange={(v) => setTimeFrame(v as TimeFrame)}
          monthValue={selectedMonth}
          onMonthChange={setSelectedMonth}
          monthOptions={MONTH_OPTIONS}
        />
        
        <LeakAreaFilter 
          selectedValues={selectedLeakAreas}
          onChange={setSelectedLeakAreas}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">加载数据中...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-sm text-gray-500">分析通话数</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.summary.totalCalls || 0}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-sm text-gray-500">提取问题数</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.summary.totalQuestions || 0}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-sm text-gray-500">平均每通</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.summary.avgQuestionsPerCall || 0} <span className="text-lg font-normal text-gray-500">个问题</span>
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Ranking Chart */}
            <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                问题排行榜 TOP 10
              </h3>
              
              <div className="space-y-3">
                {stats?.ranking.slice(0, 10).map((item, index) => (
                  <button
                    key={item.category}
                    onClick={() => setSelectedCategory(item.category)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedCategory === item.category
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {index + 1}. {item.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CATEGORY_COLORS[item.category] || 'bg-blue-500'}`}
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </button>
                ))}
                
                {(!stats?.ranking.length) && (
                  <div className="text-center py-8 text-gray-500">
                    暂无数据，请先运行分析脚本
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sample Questions */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedCategory ? `「${selectedCategory}」典型问题` : '典型问题示例'}
              </h3>
              
              {isSamplesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {samples.map((sample) => (
                    <div
                      key={sample.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="text-gray-800 mb-2">"{sample.question}"</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {getLeakAreaName(sample.leakArea) || '未知部位'}
                        </span>
                        <div className="flex items-center gap-2">
                          {sample.audioUrl && (
                            <button
                               onClick={() => handlePlayQuestion(sample)}
                               className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            >
                               <Volume2 className="h-3 w-3" />
                               {sample.timestamp ? `听录音 (${formatTime(sample.timestamp/1000)})` : '听录音'}
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/dashboard/team-calls/call-list?dealId=${sample.dealId}`, '_blank')}
                            className="text-gray-600 hover:text-gray-800 text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            详情
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {samples.length === 0 && selectedCategory && (
                    <div className="text-center py-8 text-gray-500">
                      暂无该分类的问题样本
                    </div>
                  )}
                  
                  {!selectedCategory && (
                    <div className="text-center py-8 text-gray-500">
                      请在左侧选择一个分类查看典型问题
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onCanPlay={handleCanPlay}
        preload="metadata"
      />

      {/* Floating Audio Player */}
      {activeSample && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[400px]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isPlaying) {
                  audioRef.current?.pause()
                } else {
                  audioRef.current?.play()
                }
              }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-1">
                 {activeSample.agentName || '未知坐席'} - Question
              </div>
              <div className="text-xs text-gray-500 mb-2 truncate max-w-[300px]">
                &quot;{activeSample.question}&quot;
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={audioRef.current?.duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value)
                    setCurrentTime(time)
                    if (audioRef.current) audioRef.current.currentTime = time
                  }}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-mono text-gray-600 min-w-[60px]">
                  {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={handleClosePlayer}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
