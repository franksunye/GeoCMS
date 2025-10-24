'use client'

import { CheckCircle, Circle } from 'lucide-react'

interface Publication {
  id: number
  draftId: number
  draftTitle: string
  status: 'draft' | 'review' | 'published' | 'archived'
  channels: string[]
  scheduledAt?: string
  publishedAt?: string
  archivedAt?: string
  checklist: Record<string, boolean>
  history: Array<{
    status: string
    timestamp: string
    actor: string
    note: string
  }>
}

interface PublishingChecklistProps {
  publication: Publication
}

const checklistItems = [
  { key: 'titleReview', label: 'Title Review', description: 'Title is clear and compelling' },
  { key: 'contentReview', label: 'Content Review', description: 'Content is well-written and accurate' },
  { key: 'seoOptimization', label: 'SEO Optimization', description: 'Keywords and meta tags are optimized' },
  { key: 'imageSelection', label: 'Image Selection', description: 'Images are selected and optimized' },
  { key: 'metaDescription', label: 'Meta Description', description: 'Meta description is written' },
]

export default function PublishingChecklist({
  publication,
}: PublishingChecklistProps) {
  const completedCount = Object.values(publication.checklist).filter(Boolean).length
  const totalCount = Object.keys(publication.checklist).length
  const progress = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Pre-Publish Checklist</h3>
          <span className="text-sm font-medium text-gray-600">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              {publication.checklist[item.key] ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.label}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <button
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                publication.checklist[item.key]
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {publication.checklist[item.key] ? 'Done' : 'Mark Done'}
            </button>
          </div>
        ))}
      </div>

      {/* Completion Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        {progress === 100 ? (
          <p className="text-sm text-blue-900">
            ✓ All checklist items completed. Ready to publish!
          </p>
        ) : (
          <p className="text-sm text-blue-900">
            Complete {totalCount - completedCount} more item(s) before publishing.
          </p>
        )}
      </div>
    </div>
  )
}

