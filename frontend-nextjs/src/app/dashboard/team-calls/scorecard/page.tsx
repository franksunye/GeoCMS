'use client'

import { useState } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'

type TimeFrame = 'custom' | 'yesterday' | '7d' | '30d' | '3m'
type SortBy = 'overall' | 'process' | 'skills' | 'communication'

interface SubcategoryScore {
  name: string
  score: number
}

interface CategoryMetric {
  name: string
  score: number
  weight: number
  subcategories: SubcategoryScore[]
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
  processDetails: SubcategoryScore[]
  skillsDetails: SubcategoryScore[]
  communicationDetails: SubcategoryScore[]
}

// Mock data
const mockTeamData = {
  name: 'Sales Team',
  overallScore: 80,
  recordings: 40,
  winRate: 55,
}

// Define subcategories for each dimension
const processSubcategories = [
  'Shoe Covers',
  'Agenda',
  'Inspection / Discovery',
  'Options Presentation',
  'Price Presentation',
  'Pre-close',
  'Paperwork / Next Steps',
]

const skillsSubcategories = [
  'Discovery Questions',
  'Needs Analysis',
  'Solution Positioning',
  'Objection Handling',
  'Negotiation',
  'Closing Technique',
]

const communicationSubcategories = [
  'Active Listening',
  'Clarity & Conciseness',
  'Tone & Confidence',
  'Non-verbal Communication',
  'Rapport Building',
]

// Helper function to generate subcategory scores
const generateSubcategoryScores = (
  subcategories: string[],
  baseScore: number,
  variance: number = 15
): SubcategoryScore[] => {
  return subcategories.map((name) => ({
    name,
    score: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance * 2)),
  }))
}

const mockCategories: CategoryMetric[] = [
  {
    name: 'Process Adherence',
    score: 79,
    weight: 60,
    subcategories: processSubcategories.map((name) => ({ name, score: 79 })),
  },
  {
    name: 'Sales Skills',
    score: 93,
    weight: 30,
    subcategories: skillsSubcategories.map((name) => ({ name, score: 93 })),
  },
  {
    name: 'Communication',
    score: 60,
    weight: 10,
    subcategories: communicationSubcategories.map((name) => ({ name, score: 60 })),
  },
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
    processDetails: generateSubcategoryScores(processSubcategories, 96),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 93),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 95),
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
    processDetails: generateSubcategoryScores(processSubcategories, 92),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 81),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 98),
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
    processDetails: generateSubcategoryScores(processSubcategories, 79),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 81),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 45),
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
    processDetails: generateSubcategoryScores(processSubcategories, 73),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 90),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 45),
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
    processDetails: generateSubcategoryScores(processSubcategories, 79),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 88),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 65),
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
    processDetails: generateSubcategoryScores(processSubcategories, 75),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 88),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 55),
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
    processDetails: generateSubcategoryScores(processSubcategories, 39),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 50),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 45),
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
    processDetails: generateSubcategoryScores(processSubcategories, 30),
    skillsDetails: generateSubcategoryScores(skillsSubcategories, 48),
    communicationDetails: generateSubcategoryScores(communicationSubcategories, 45),
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

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

      {/* Team Overview Card with Nested Category Metrics */}
      <div className="bg-white shadow rounded-lg p-8 border-l-4 border-blue-600">
        {/* Top Section: Team Info + Button */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Team Name and Score */}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Team {mockTeamData.name}</h2>
                <p className={`text-4xl font-bold ${getScoreColor(mockTeamData.overallScore)}`}>
                  {mockTeamData.overallScore}
                </p>
              </div>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>{mockTeamData.recordings} Recordings</p>
                <p>{mockTeamData.winRate}% Win Rate</p>
              </div>
            </div>
          </div>
          
          {/* View Recordings Button */}
          <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors">
            View Recordings →
          </button>
        </div>
        
        {/* Category Metrics Grid - Inside the main card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockCategories.map((category) => (
            <div key={category.name}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                className={`w-full rounded-lg p-6 border border-gray-200 ${getScoreBgColor(category.score)} hover:shadow-md transition-all text-left cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 font-semibold">{category.name}</p>
                    <p className="text-xs text-gray-600 mt-3">Category Weight: {category.weight}%</p>
                  </div>
                  <p className={`text-3xl font-bold ${getScoreColor(category.score)}`}>{category.score}</p>
                </div>
              </button>
            </div>
          ))}
        </div>
        
        {/* Expanded Category Table */}
        {expandedCategory && (
          <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-sm text-gray-900">Subcategory</th>
                  <th className="text-left px-6 py-3 font-semibold text-sm text-gray-900">Team</th>
                  {sortedAgents.map((agent) => (
                    <th key={agent.id} className="text-left px-6 py-3 font-semibold text-sm text-gray-900">
                      {agent.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expandedCategory === 'Process Adherence'
                  ? mockAgents[0].processDetails.map((sub, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{sub.name}</td>
                        <td className={`px-6 py-3 text-sm font-bold ${getScoreColor(mockCategories[0].score)}`}>
                          {Math.round(
                            mockAgents.reduce((sum, agent) => sum + agent.processDetails[idx].score, 0) /
                              mockAgents.length
                          )}
                        </td>
                        {sortedAgents.map((agent) => (
                          <td
                            key={agent.id}
                            className={`px-6 py-3 text-sm font-bold ${getScoreColor(
                              agent.processDetails[idx].score
                            )}`}
                          >
                            {Math.round(agent.processDetails[idx].score)}
                          </td>
                        ))}
                      </tr>
                    ))
                  : expandedCategory === 'Sales Skills'
                  ? mockAgents[0].skillsDetails.map((sub, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{sub.name}</td>
                        <td className={`px-6 py-3 text-sm font-bold ${getScoreColor(mockCategories[1].score)}`}>
                          {Math.round(
                            mockAgents.reduce((sum, agent) => sum + agent.skillsDetails[idx].score, 0) /
                              mockAgents.length
                          )}
                        </td>
                        {sortedAgents.map((agent) => (
                          <td
                            key={agent.id}
                            className={`px-6 py-3 text-sm font-bold ${getScoreColor(
                              agent.skillsDetails[idx].score
                            )}`}
                          >
                            {Math.round(agent.skillsDetails[idx].score)}
                          </td>
                        ))}
                      </tr>
                    ))
                  : mockAgents[0].communicationDetails.map((sub, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{sub.name}</td>
                        <td className={`px-6 py-3 text-sm font-bold ${getScoreColor(mockCategories[2].score)}`}>
                          {Math.round(
                            mockAgents.reduce((sum, agent) => sum + agent.communicationDetails[idx].score, 0) /
                              mockAgents.length
                          )}
                        </td>
                        {sortedAgents.map((agent) => (
                          <td
                            key={agent.id}
                            className={`px-6 py-3 text-sm font-bold ${getScoreColor(
                              agent.communicationDetails[idx].score
                            )}`}
                          >
                            {Math.round(agent.communicationDetails[idx].score)}
                          </td>
                        ))}
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
              {/* Header: Name/Stats & Overall Score */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{agent.name}</h4>
                  <div className="mt-1 space-y-0.5 text-xs font-medium text-gray-500">
                    <p>{agent.recordings} Recordings</p>
                    <p>{agent.winRate}% Win Rate</p>
                  </div>
                </div>
                
                {/* Overall Score Circle */}
                <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm ${getScoreColor(agent.overallScore)}`}>
                  <span className="text-3xl font-bold">{agent.overallScore}</span>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Process</span>
                  <span className={`font-bold ${getScoreColor(agent.process)}`}>{agent.process}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Skills</span>
                  <span className={`font-bold ${getScoreColor(agent.skills)}`}>{agent.skills}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Communication</span>
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
            {/* Modal Header */}
            <div className="flex items-start justify-between p-8 border-b border-gray-200 bg-gray-900 text-white">
              <div>
                <h2 className="text-3xl font-bold">{selectedAgent.name}</h2>
                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-400">Recordings</p>
                    <p className="text-lg font-semibold">{selectedAgent.recordings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-lg font-semibold">{selectedAgent.winRate}%</p>
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

            {/* Modal Content - Three Dimensions with Tables */}
            <div className="p-8 space-y-8">
              {/* Helper function to calculate team average and diff */}
              {[
                {
                  title: 'Process Adherence',
                  score: selectedAgent.process,
                  details: selectedAgent.processDetails,
                },
                {
                  title: 'Sales Skills',
                  score: selectedAgent.skills,
                  details: selectedAgent.skillsDetails,
                },
                {
                  title: 'Communication',
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
                  <p className="text-sm text-gray-600 mb-4">Category Weight: {mockCategories[dimIdx].weight}%</p>

                  {/* Table */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left px-4 py-3 font-semibold text-gray-900">Subcategory</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900">Rep</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900">Team</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dimension.details.map((detail, idx) => {
                        const teamAvg = Math.round(
                          mockAgents.reduce(
                            (sum, agent) =>
                              sum +
                              (dimIdx === 0
                                ? agent.processDetails[idx].score
                                : dimIdx === 1
                                ? agent.skillsDetails[idx].score
                                : agent.communicationDetails[idx].score),
                            0
                          ) / mockAgents.length
                        );
                        const diff = Math.round(detail.score) - teamAvg;
                        return (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{detail.name}</td>
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

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors font-medium"
              >
                Close
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
