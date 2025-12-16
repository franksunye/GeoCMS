'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, TrendingUp, Loader2, ExternalLink, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import AgentAvatar from '@/components/team/AgentAvatar'
import { AgentId } from '@/types'
import { getScoreColor, getScoreBgColor } from '@/lib/score-thresholds'
import { PageHeader } from '@/components/ui/page-header'
import { TimeRangeSelector } from '@/components/ui/time-range-selector'

type TimeFrame = 'today' | 'week' | '7d' | '30d' | 'all'
type SortBy = 'overall' | 'process' | 'skills' | 'communication'

interface SubcategoryScore {
  name: string
  score: number
  tagId?: string
  is_mandatory?: boolean
}

interface CategoryMetric {
  name: string
  score: number
  weight: number
  subcategories: SubcategoryScore[]
}

interface Agent {
  id: string
  teamId?: string
  avatarId: AgentId
  name: string
  overallScore: number
  recordings: number
  winRate: number
  process: number
  skills: number
  communication: number
  processDetails: SubcategoryScore[]
  skillsDetails: SubcategoryScore[]
  communicationDetails: SubcategoryScore[]
}

export default function ScorecardPage() {
  const router = useRouter()
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7d')
  const [selectedTeam, setSelectedTeam] = useState<string>('9055771909563658940')
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<SortBy>('overall')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scoreConfig, setScoreConfig] = useState({
    processWeight: 30,
    skillsWeight: 50,
    communicationWeight: 20
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const agentsRes = await fetch(`/api/team-calls/scorecard/agents?timeframe=${timeFrame}`)
        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents(data)
        } else {
          console.warn('Failed to fetch agents')
          setAgents([])
        }

        const configRes = await fetch('/api/team-calls/config/score')
        if (configRes.ok) {
          const data = await configRes.json()
          setScoreConfig(data)
        }
      } catch (e) {
        console.error('Error fetching data:', e)
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [timeFrame])

  const teams = useMemo(() => {
    const uniqueTeams = new Set(agents.map(a => a.teamId).filter(Boolean) as string[])
    return Array.from(uniqueTeams).sort()
  }, [agents])

  const filteredAgents = useMemo(() => {
    let result = agents
    if (selectedTeam !== 'all') {
      result = result.filter(a => a.teamId === selectedTeam)
    }
    if (showOnlyActive) {
      result = result.filter(a => a.recordings > 0)
    }
    return result
  }, [agents, selectedTeam, showOnlyActive])

  const categories = useMemo(() => {
    if (filteredAgents.length === 0) {
      return [
        {
          name: '流程遵循度',
          score: 0,
          weight: scoreConfig.processWeight,
          subcategories: []
        },
        {
          name: '销售技巧',
          score: 0,
          weight: scoreConfig.skillsWeight,
          subcategories: []
        },
        {
          name: '沟通能力',
          score: 0,
          weight: scoreConfig.communicationWeight,
          subcategories: []
        }
      ]
    }

    const processScore = Math.round(filteredAgents.reduce((acc, a) => acc + a.process, 0) / filteredAgents.length)
    const skillsScore = Math.round(filteredAgents.reduce((acc, a) => acc + a.skills, 0) / filteredAgents.length)
    const communicationScore = Math.round(filteredAgents.reduce((acc, a) => acc + a.communication, 0) / filteredAgents.length)

    const getSubcategoryAverages = (key: 'processDetails' | 'skillsDetails' | 'communicationDetails') => {
      const firstAgent = filteredAgents[0]
      if (!firstAgent || !firstAgent[key] || firstAgent[key].length === 0) {
        return []
      }
      
      return firstAgent[key].map((sub, idx) => {
        const avg = Math.round(filteredAgents.reduce((acc, a) => acc + (a[key][idx]?.score || 0), 0) / filteredAgents.length)
        return { name: sub.name, is_mandatory: sub.is_mandatory, score: avg }
      })
    }

    return [
      {
        name: '流程遵循度',
        score: processScore,
        weight: scoreConfig.processWeight,
        subcategories: getSubcategoryAverages('processDetails')
      },
      {
        name: '销售技巧',
        score: skillsScore,
        weight: scoreConfig.skillsWeight,
        subcategories: getSubcategoryAverages('skillsDetails')
      },
      {
        name: '沟通能力',
        score: communicationScore,
        weight: scoreConfig.communicationWeight,
        subcategories: getSubcategoryAverages('communicationDetails')
      }
    ]
  }, [filteredAgents, scoreConfig])

  const teamStats = useMemo(() => {
    if (filteredAgents.length === 0) {
      return {
        name: '销售团队',
        overallScore: 0,
        recordings: 0,
        winRate: 0
      }
    }
    return {
      name: '销售团队',
      overallScore: Math.round(filteredAgents.reduce((acc, a) => acc + a.overallScore, 0) / filteredAgents.length),
      recordings: filteredAgents.reduce((acc, a) => acc + a.recordings, 0),
      winRate: Math.round(filteredAgents.reduce((acc, a) => acc + a.winRate, 0) / filteredAgents.length)
    }
  }, [filteredAgents])

  const sortedAgents = useMemo(() => {
    return [...filteredAgents].sort((a, b) => {
      switch (sortBy) {
        case 'process': return b.process - a.process
        case 'skills': return b.skills - a.skills
        case 'communication': return b.communication - a.communication
        case 'overall': default: return b.overallScore - a.overallScore
      }
    })
  }, [filteredAgents, sortBy])


  const activeCategory = categories.find(c => c.name === expandedCategory)

  const handleViewRecordings = (targetAgentId?: string, targetTagId?: string) => {
    const params = new URLSearchParams()
    
    // Calculate Date Range
    const now = new Date()
    let startDate: Date | null = null
    
    switch (timeFrame) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date(now)
        const day = startDate.getDay()
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
        startDate.setDate(diff)
        startDate.setHours(0, 0, 0, 0)
        break
      case '7d':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case '30d':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'all':
        startDate = null
        break
    }

    if (startDate) {
      params.set('startDate', startDate.toISOString())
      params.set('endDate', now.toISOString())
    }

    if (targetAgentId) {
      params.set('agentId', targetAgentId)
    }

    if (targetTagId) {
      params.set('includeTags', targetTagId)
    }
    
    const url = `/dashboard/team-calls/call-list?${params.toString()}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="评分看板"
        description="团队绩效指标与个人排名"
      />

      {/* Top Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">团队</span>
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-50"
              >
                <option value="all">所有团队</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">时间范围</span>
            <TimeRangeSelector
              value={timeFrame}
              onChange={(v) => setTimeFrame(v as TimeFrame)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showOnlyActive ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showOnlyActive ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700">
              仅显示有录音
            </div>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">排序方式</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-50"
              >
                <option value="overall">综合评分</option>
                <option value="process">流程遵循</option>
                <option value="skills">销售技巧</option>
                <option value="communication">沟通能力</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
        </div>
      </div>
    </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Team Overview Skeleton */}
          <div className="bg-white shadow rounded-lg p-8 animate-pulse">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                <div>
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
          
          {/* Agent Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white shadow rounded-xl p-5 animate-pulse">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2.5">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Loading indicator */}
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">加载评分数据中...</span>
          </div>
        </div>
      ) : (
        <>
      {/* Team Overview Card */}
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">团队 {teamStats.name}</h2>
                <p className={`text-4xl font-bold ${getScoreColor(teamStats.overallScore)}`}>
                  {teamStats.overallScore}
                </p>
              </div>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>{teamStats.recordings} 条录音</p>
                <p>{teamStats.winRate}% 赢单率</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleViewRecordings()}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            查看录音 →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                className={`w-full rounded-lg p-6 border border-gray-200 ${getScoreBgColor(category.score)} hover:shadow-md transition-all text-left cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 font-semibold">{category.name}</p>
                    <p className="text-xs text-gray-600 mt-3">权重: {category.weight}%</p>
                  </div>
                  <p className={`text-3xl font-bold ${getScoreColor(category.score)}`}>{category.score}</p>
                </div>
              </button>
            </div>
          ))}
        </div>
        
        {expandedCategory && activeCategory && activeCategory.subcategories.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-sm text-gray-900">子分类</th>
                  <th className="text-left px-6 py-3 font-semibold text-sm text-gray-900">团队</th>
                  {sortedAgents.map((agent) => (
                    <th key={agent.id} className="text-left px-6 py-3 font-semibold text-sm text-gray-900">
                      {agent.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeCategory.subcategories.map((sub, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        {sub.name}
                        {sub.is_mandatory && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            必选
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-3 text-sm font-bold ${getScoreColor(activeCategory.score)}`}>
                      {sub.score}
                    </td>
                    {sortedAgents.map((agent) => {
                       const details = expandedCategory === '流程遵循度' ? agent.processDetails :
                                       expandedCategory === '销售技巧' ? agent.skillsDetails :
                                       agent.communicationDetails
                       const score = details[idx]?.score || 0
                       return (
                        <td
                          key={agent.id}
                          className={`px-6 py-3 text-sm font-bold ${getScoreColor(score)}`}
                        >
                          {Math.round(score)}
                        </td>
                       )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agent Rankings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full text-left cursor-pointer rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow ${getScoreBgColor(
                agent.overallScore
              )}`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <AgentAvatar agentId={agent.avatarId} size="md" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{agent.name}</h4>
                    <div className="mt-1 space-y-0.5 text-xs font-medium text-gray-500">
                <p>{agent.recordings} 条录音</p>
                <p>{agent.winRate}% 赢单率</p>
              </div>
                  </div>
                </div>
                <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm ${getScoreColor(agent.overallScore)}`}>
                  <span className="text-3xl font-bold">{agent.overallScore}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">流程</span>
                  <span className={`font-bold ${getScoreColor(agent.process)}`}>{agent.process}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">技巧</span>
                  <span className={`font-bold ${getScoreColor(agent.skills)}`}>{agent.skills}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">沟通</span>
                  <span className={`font-bold ${getScoreColor(agent.communication)}`}>{agent.communication}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            {/* 1. Fixed Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-white z-10">
              <div className="flex gap-5 items-center">
                <div className="p-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full">
                  <AgentAvatar agentId={selectedAgent.avatarId} size="xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>{selectedAgent.recordings} 条录音</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span>{selectedAgent.winRate}% 赢单率</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex gap-2">
                    <button
                    onClick={() => handleViewRecordings(selectedAgent.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 rounded-lg transition-colors text-sm font-semibold shadow-sm"
                  >
                    查看全部录音
                    <ExternalLink className="h-4 w-4" />
                  </button>
                    <button
                      onClick={() => setSelectedAgent(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">综合评分</span>
                  <span className={`text-3xl font-bold ${getScoreColor(selectedAgent.overallScore)}`}>{selectedAgent.overallScore}</span>
                </div>
              </div>
            </div>

            {/* 2. Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
              <div className="space-y-6">
                {[
                  {
                    title: '流程遵循度',
                    score: selectedAgent.process,
                    details: selectedAgent.processDetails,
                  },
                  {
                    title: '销售技巧',
                    score: selectedAgent.skills,
                    details: selectedAgent.skillsDetails,
                  },
                  {
                    title: '沟通能力',
                    score: selectedAgent.communication,
                    details: selectedAgent.communicationDetails,
                  },
                ].map((dimension, dimIdx) => (
                  <div key={dimIdx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{dimension.title}</h3>
                        <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          权重 {categories[dimIdx].weight}%
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                        {dimension.score}
                      </div>
                    </div>

                    <div className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                            <th className="text-left px-6 py-3 font-medium">评估项</th>
                            <th className="text-center px-6 py-3 font-medium w-32">个人得分</th>
                            <th className="text-center px-6 py-3 font-medium w-32">团队平均</th>
                            <th className="text-center px-6 py-3 font-medium w-24">差异</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dimension.details.map((detail, idx) => {
                            // Filter agents to get only those in the same team as the selected agent
                            const teamAgents = selectedAgent.teamId 
                              ? agents.filter(a => a.teamId === selectedAgent.teamId)
                              : agents;
                              
                            const teamAvg = teamAgents.length > 0 ? Math.round(
                              teamAgents.reduce(
                                (sum, agent) =>
                                  sum +
                                  (dimIdx === 0
                                    ? agent.processDetails[idx]?.score || 0
                                    : dimIdx === 1
                                    ? agent.skillsDetails[idx]?.score || 0
                                    : agent.communicationDetails[idx]?.score || 0),
                                0
                              ) / teamAgents.length
                            ) : 0;
                            const diff = Math.round(detail.score) - teamAvg;
                            return (
                              <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-3.5 text-sm text-gray-900">
                                  <div className="flex items-center gap-2 font-medium">
                                    {detail.name}
                                    {detail.is_mandatory && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-50 text-amber-700 border border-amber-100 tracking-wide">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <TooltipProvider>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <td 
                                        className={`px-6 py-3.5 text-center cursor-pointer relative hover:bg-white transition-all duration-200 border-x border-transparent hover:border-gray-100 hover:shadow-sm`}
                                        onClick={() => handleViewRecordings(selectedAgent.id, detail.tagId)}
                                      >
                                          <div className={`text-sm font-bold inline-flex items-center gap-1.5 ${getScoreColor(detail.score)}`}>
                                            {Math.round(detail.score)}
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-gray-400 transition-all transform translate-y-0.5" />
                                          </div>
                                      </td>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="flex items-center bg-gray-900 text-white border-gray-800">
                                      <p className="text-xs font-medium">点击查看相关录音</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <td className="px-6 py-3.5 text-center text-sm font-medium text-gray-500">
                                  {teamAvg}
                                </td>
                                <td
                                  className={`px-6 py-3.5 text-center text-sm font-bold ${
                                    diff > 0
                                      ? 'text-emerald-600'
                                      : diff < 0
                                      ? 'text-rose-600'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {diff > 0 ? '+' : ''}{diff}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* No footer needed as button is in header */}
          </div>
        </div>
      )}
        </div>
      )}
        </>
      )}
    </div>
  )
}
