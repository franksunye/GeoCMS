'use client'

import { AgentReasoning } from '@/types'
import { Brain, ChevronDown, Lightbulb, Target } from 'lucide-react'
import { useState } from 'react'

interface ReasoningPanelProps {
  reasoning: AgentReasoning[]
}

const getConfidenceColor = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getConfidenceBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

export default function ReasoningPanel({ reasoning }: ReasoningPanelProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(
    reasoning.length > 0 ? reasoning[0].agent_id : null
  )

  if (!reasoning || reasoning.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No agent reasoning available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reasoning.map((agent) => (
        <div key={agent.agent_id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() =>
              setExpandedAgent(expandedAgent === agent.agent_id ? null : agent.agent_id)
            }
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
              expandedAgent === agent.agent_id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900">{agent.agent_name}</h4>
                <p className="text-xs text-gray-500">
                  Confidence: <span className={`font-semibold ${getConfidenceColor(agent.confidence_score)}`}>
                    {agent.confidence_score}%
                  </span>
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedAgent === agent.agent_id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expanded Content */}
          {expandedAgent === agent.agent_id && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
              {/* Confidence Score */}
              <div className={`border rounded-lg p-3 ${getConfidenceBgColor(agent.confidence_score)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                  <span className={`text-lg font-bold ${getConfidenceColor(agent.confidence_score)}`}>
                    {agent.confidence_score}%
                  </span>
                </div>
              </div>

              {/* Thinking Process */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Thinking Process
                </h5>
                <div className="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200">
                  <p className="whitespace-pre-wrap">{agent.thinking_process}</p>
                </div>
              </div>

              {/* Decision Rationale */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Decision Rationale
                </h5>
                <div className="bg-white rounded p-3 text-sm text-gray-700 border border-gray-200">
                  <p>{agent.decision_rationale}</p>
                </div>
              </div>

              {/* Data Sources */}
              {agent.data_sources.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Data Sources</h5>
                  <div className="space-y-2">
                    {agent.data_sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternatives Considered */}
              {agent.alternatives_considered.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Alternatives Considered</h5>
                  <div className="space-y-2">
                    {agent.alternatives_considered.map((alt, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                        <span>{alt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                Generated: {new Date(agent.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

