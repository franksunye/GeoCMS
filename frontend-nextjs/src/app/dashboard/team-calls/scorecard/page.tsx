'use client'

import { useState } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'

type TimeFrame = 'custom' | 'yesterday' | '7d' | '30d' | '3m'
type SortBy = 'overall' | 'process' | 'skills' | 'communication'

interface CategoryMetric {
  name: string
  score: number
  weight: number
}

interface Agent {
  id: string
  name: string
  overallScore: number
  recordings: number
  winRate: number
  process: number
  skills: number
  communication: number
}

// Mock data
const mockTeamData = {
  name: 'Sales Team',
  overallScore: 80,
  recordings: 40,
  winRate: 55,
}

const mockCategories: CategoryMetric[] = [
  { name: 'Process Adherence', score: 79, weight: 60 },
  { name: 'Sales Skills', score: 93, weight: 30 },
  { name: 'Communication', score: 60, weight: 10 },
]

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Mike Jones',
    overallScore: 95,
    recordings: 10,
    winRate: 60,
    process: 96,
    skills: 93,
    communication: 95,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    overallScore: 94,
    recordings: 10,
    winRate: 50,
    process: 92,
    skills: 81,
    communication: 98,
  },
  {
    id: '3',
    name: 'Derrick Deacon',
    overallScore: 80,
    recordings: 10,
    winRate: 40,
    process: 79,
    skills: 81,
    communication: 45,
  },
  {
    id: '4',
    name: 'Sheryl Grow',
    overallScore: 78,
    recordings: 10,
    winRate: 30,
    process: 73,
    skills: 90,
    communication: 45,
  },
  {
    id: '5',
    name: 'Sam Waltman',
    overallScore: 77,
    recordings: 10,
    winRate: 30,
    process: 79,
    skills: 88,
    communication: 65,
  },
  {
    id: '6',
    name: 'Bree Dawn',
    overallScore: 72,
    recordings: 10,
    winRate: 20,
    process: 75,
    skills: 88,
    communication: 55,
  },
  {
    id: '7',
    name: 'Hillary Wilt',
    overallScore: 42,
    recordings: 10,
    winRate: 20,
    process: 39,
    skills: 50,
    communication: 45,
  },
  {
    id: '8',
    name: 'Drew Able',
    overallScore: 38,
    recordings: 10,
    winRate: 10,
    process: 30,
    skills: 48,
    communication: 45,
  },
]

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-50'
  if (score >= 60) return 'bg-yellow-50'
  return 'bg-red-50'
}

export default function ScorecardPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7d')
  const [sortBy, setSortBy] = useState<SortBy>('overall')

  const sortedAgents = [...mockAgents].sort((a, b) => {
    switch (sortBy) {
      case 'process':
        return b.process - a.process
      case 'skills':
        return b.skills - a.skills
      case 'communication':
        return b.communication - a.communication
      case 'overall':
      default:
        return b.overallScore - a.overallScore
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scorecard</h1>
          <p className="mt-2 text-gray-600">Team performance metrics and individual agent rankings</p>
        </div>
      </div>

      {/* Top Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">TIMEFRAME</span>
          <div className="flex gap-2">
            {(['custom', 'yesterday', '7d', '30d', '3m'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFrame === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf === 'custom'
                  ? 'Custom'
                  : tf === 'yesterday'
                  ? 'Yesterday'
                  : tf === '7d'
                  ? '7D'
                  : tf === '30d'
                  ? '30D'
                  : '3M'}
              </button>
            ))}
          </div>
        </div>

        {/* Scorecard Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">SCORECARD</span>
          <div className="relative">
            <button className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              Default
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">SORT BY</span>
          <div className="relative">
            <button className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              {sortBy === 'overall'
                ? 'Overall Score'
                : sortBy === 'process'
                ? 'Process Adherence'
                : sortBy === 'skills'
                ? 'Sales Skills'
                : 'Communication'}
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="hidden absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {[
                { value: 'overall', label: 'Overall Score' },
                { value: 'process', label: 'Process Adherence' },
                { value: 'skills', label: 'Sales Skills' },
                { value: 'communication', label: 'Communication' },
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

      {/* Team Overview - Single Section */}
      <div className="bg-white shadow rounded-lg p-8 border-l-4 border-blue-600">
        <h2 className="text-4xl font-bold text-gray-900 mb-8">{mockTeamData.name}</h2>
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Overall Score */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Overall Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(mockTeamData.overallScore)}`}>
              {mockTeamData.overallScore}
            </p>
          </div>

          {/* Recordings */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Recordings</p>
            <p className="text-5xl font-bold text-gray-900">{mockTeamData.recordings}</p>
          </div>

          {/* Win Rate */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Win Rate</p>
            <p className="text-5xl font-bold text-gray-900">{mockTeamData.winRate}%</p>
          </div>
        </div>
      </div>

      {/* Category Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockCategories.map((category) => (
          <div key={category.name} className={`rounded-lg p-6 border border-gray-200 ${getScoreBgColor(category.score)}`}>
            <p className="text-sm text-gray-600 mb-3">{category.name}</p>
            <div className="flex items-baseline justify-between">
              <p className={`text-4xl font-bold ${getScoreColor(category.score)}`}>{category.score}</p>
              <p className="text-xs text-gray-600">Weight: {category.weight}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Rankings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedAgents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-lg border border-gray-200 p-5 bg-white hover:shadow-md transition-shadow"
            >
              {/* Agent Header */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 text-sm">{agent.name}</h4>
                <div className="flex items-center justify-between mt-3">
                  <p className={`text-3xl font-bold ${getScoreColor(agent.overallScore)}`}>
                    {agent.overallScore}
                  </p>
                  <TrendingUp className={`h-5 w-5 ${agent.overallScore >= 80 ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>

              {/* Recording & Win Rate - Compact */}
              <div className="mb-4 pb-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>{agent.recordings} Recordings</span>
                </div>
                <div className="flex justify-between">
                  <span>{agent.winRate}% Win Rate</span>
                </div>
              </div>

              {/* Category Scores with Individual Backgrounds */}
              <div className="space-y-2">
                <div className={`rounded p-3 flex justify-between items-center ${getScoreBgColor(agent.process)}`}>
                  <span className="text-xs font-medium text-gray-700">Process</span>
                  <span className={`text-sm font-bold ${getScoreColor(agent.process)}`}>{agent.process}</span>
                </div>
                <div className={`rounded p-3 flex justify-between items-center ${getScoreBgColor(agent.skills)}`}>
                  <span className="text-xs font-medium text-gray-700">Skills</span>
                  <span className={`text-sm font-bold ${getScoreColor(agent.skills)}`}>{agent.skills}</span>
                </div>
                <div className={`rounded p-3 flex justify-between items-center ${getScoreBgColor(agent.communication)}`}>
                  <span className="text-xs font-medium text-gray-700">Communication</span>
                  <span className={`text-sm font-bold ${getScoreColor(agent.communication)}`}>{agent.communication}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
