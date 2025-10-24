'use client'

import { QualityScore, QualitySuggestion } from '@/types'
import { AlertCircle, CheckCircle, AlertTriangle, Zap } from 'lucide-react'
import { useState } from 'react'

interface QualityScoreCardProps {
  qualityScore: QualityScore
  onApplySuggestion?: (suggestion: QualitySuggestion) => void
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    default:
      return <Zap className="h-4 w-4 text-blue-600" />
  }
}

export default function QualityScoreCard({
  qualityScore,
  onApplySuggestion,
}: QualityScoreCardProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)

  const scoreMetrics = [
    { label: 'Readability', value: qualityScore.readability_score },
    { label: 'SEO', value: qualityScore.seo_score },
    { label: 'Tone', value: qualityScore.tone_consistency },
    { label: 'Brand', value: qualityScore.brand_alignment },
    { label: 'Compliance', value: qualityScore.compliance_score },
  ]

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className={`border rounded-lg p-6 ${getScoreBgColor(qualityScore.overall_score)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Content Quality</h3>
          <div className="flex items-center gap-2">
            <div className={`text-4xl font-bold ${getScoreColor(qualityScore.overall_score)}`}>
              {qualityScore.overall_score}
            </div>
            <span className="text-sm text-gray-600">/100</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {scoreMetrics.map((metric) => (
            <div key={metric.label} className="bg-white rounded p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
              <div className={`text-lg font-semibold ${getScoreColor(metric.value)}`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {qualityScore.suggestions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-semibold text-gray-900">
              {qualityScore.suggestions.length} Suggestion{qualityScore.suggestions.length !== 1 ? 's' : ''}
            </h4>
          </div>

          <div className="divide-y">
            {qualityScore.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getSuggestionIcon(suggestion.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-gray-900">{suggestion.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Category: <span className="capitalize">{suggestion.category}</span>
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                          suggestion.severity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : suggestion.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {suggestion.severity}
                      </span>
                    </div>

                    {/* Expandable suggestion details */}
                    <button
                      onClick={() =>
                        setExpandedSuggestion(
                          expandedSuggestion === suggestion.id ? null : suggestion.id
                        )
                      }
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      {expandedSuggestion === suggestion.id ? 'Hide' : 'Show'} suggestion
                    </button>

                    {expandedSuggestion === suggestion.id && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                        {suggestion.autoFixAvailable && (
                          <button
                            onClick={() => onApplySuggestion?.(suggestion)}
                            className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Apply Fix
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues */}
      {qualityScore.suggestions.length === 0 && qualityScore.overall_score >= 80 && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">Great! Your content meets all quality standards.</p>
        </div>
      )}
    </div>
  )
}

