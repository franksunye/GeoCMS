'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'
import AgentAvatar from '@/components/team/AgentAvatar'
import { AgentId } from '@/types'
import { getScoreColor, getScoreBgColor } from '@/lib/score-thresholds'

type TimeFrame = 'custom' | 'yesterday' | '7d' | '30d' | '3m'
type SortBy = 'overall' | 'process' | 'skills' | 'communication'

interface SubcategoryScore {
  name: string
  score: number
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
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7d')
  const [selectedTeam, setSelectedTeam] = useState<string>('9055771909563658940')
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<SortBy>('overall')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [scoreConfig, setScoreConfig] = useState({
    processWeight: 30,
    skillsWeight: 50,
    communicationWeight: 20
  })

  useEffect(() => {
    const fetchData = async () => {
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
        return { name: sub.name, score: avg }
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

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'process': return b.process - a.process
      case 'skills': return b.skills - a.skills
      case 'communication': return b.communication - a.communication
      case 'overall': default: return b.overallScore - a.overallScore
    }
  })

  const activeCategory = categories.find(c => c.name === expandedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">评分看板</h1>
          <p className="mt-2 text-gray-600">团队绩效指标与个人排名</p>
        </div>
      </div>

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
            <div className="flex gap-2">
              {(['custom', 'yesterday', '7d', '30d', '3m'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeFrame === tf ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {tf === 'custom' ? '自定义' : tf === 'yesterday' ? '昨天' : tf === '7d' ? '近7天' : tf === '30d' ? '近30天' : '近3个月'}
                </button>
              ))}
            </div>
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
            <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              {sortBy === 'overall' ? '综合评分' : sortBy === 'process' ? '流程遵循' : sortBy === 'skills' ? '销售技巧' : '沟通能力'}
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="hidden absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 group-hover:block">
              {[
                { value: 'overall', label: '综合评分' },
                { value: 'process', label: '流程遵循' },
                { value: 'skills', label: '销售技巧' },
                { value: 'communication', label: '沟通能力' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortBy)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Team Overview Card */}
      <div className="bg-white shadow rounded-lg p-8 border-l-4 border-blue-600">
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
          <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors">
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
                    <td className="px-6 py-3 text-sm text-gray-900 font-medium">{sub.name}</td>
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
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-8 border-b border-gray-200 bg-gray-900 text-white">
              <div className="flex gap-6 items-center">
                <div className="bg-white rounded-full p-1">
                  <AgentAvatar agentId={selectedAgent.avatarId} size="xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{selectedAgent.name}</h2>
                  <div className="flex items-center gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-400">录音数量</p>
                      <p className="text-lg font-semibold">{selectedAgent.recordings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">赢单率</p>
                      <p className="text-lg font-semibold">{selectedAgent.winRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{selectedAgent.overallScore}</p>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-white text-3xl mt-2"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
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
                <div key={dimIdx}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{dimension.title}</h3>
                    <p className={`text-3xl font-bold ${getScoreColor(dimension.score)}`}>
                      {dimension.score}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">权重: {categories[dimIdx].weight}%</p>

                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left px-4 py-3 font-semibold text-gray-900">子分类</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900">个人</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900">团队</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900">差值</th>
                      </tr>
                    </thead>
                    <tbody>
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
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              <div className="flex items-center gap-2">
                                {detail.name}
                                {detail.is_mandatory && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    必选
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-center text-sm font-bold ${getScoreColor(detail.score)}`}>
                              {Math.round(detail.score)}
                            </td>
                            <td className={`px-4 py-3 text-center text-sm font-bold ${getScoreColor(teamAvg)}`}>
                              {teamAvg}
                            </td>
                            <td
                              className={`px-4 py-3 text-center text-sm font-bold ${
                                diff > 0
                                  ? 'text-green-600'
                                  : diff < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
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
              ))}
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors font-medium"
              >
                关闭
              </button>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-colors font-medium">
                View Recordings →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
