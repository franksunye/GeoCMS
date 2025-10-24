'use client'

import { CheckCircle, Circle, ArrowRight } from 'lucide-react'

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

interface PublishingStateFlowProps {
  publication: Publication
}

const states = ['draft', 'review', 'published', 'archived']

export default function PublishingStateFlow({
  publication,
}: PublishingStateFlowProps) {
  const currentIndex = states.indexOf(publication.status)

  return (
    <div className="space-y-6">
      {/* State Flow Diagram */}
      <div className="flex items-center justify-between">
        {states.map((state, index) => (
          <div key={state} className="flex items-center flex-1">
            {/* State Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  index <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index <= currentIndex ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 mt-2 capitalize">
                {state}
              </p>
            </div>

            {/* Arrow */}
            {index < states.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* State Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Current Status</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-gray-900 ml-2 capitalize">
              {publication.status}
            </span>
          </p>
          {publication.publishedAt && (
            <p>
              <span className="text-gray-600">Published:</span>
              <span className="font-medium text-gray-900 ml-2">
                {new Date(publication.publishedAt).toLocaleString()}
              </span>
            </p>
          )}
          {publication.scheduledAt && (
            <p>
              <span className="text-gray-600">Scheduled:</span>
              <span className="font-medium text-gray-900 ml-2">
                {new Date(publication.scheduledAt).toLocaleString()}
              </span>
            </p>
          )}
          {publication.channels.length > 0 && (
            <p>
              <span className="text-gray-600">Channels:</span>
              <span className="font-medium text-gray-900 ml-2">
                {publication.channels.join(', ')}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {publication.status === 'draft' && (
          <>
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Submit for Review
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Schedule
            </button>
          </>
        )}
        {publication.status === 'review' && (
          <>
            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Approve & Publish
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Request Changes
            </button>
          </>
        )}
        {publication.status === 'published' && (
          <>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Rollback
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Archive
            </button>
          </>
        )}
      </div>
    </div>
  )
}

