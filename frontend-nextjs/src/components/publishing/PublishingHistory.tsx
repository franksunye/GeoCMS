'use client'

import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

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

interface PublishingHistoryProps {
  publication: Publication
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'published':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'review':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />
    default:
      return <Clock className="h-5 w-5 text-blue-600" />
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PublishingHistory({
  publication,
}: PublishingHistoryProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Publishing Timeline</h3>

      {/* Timeline */}
      <div className="space-y-4">
        {publication.history.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0">
                {getStatusIcon(event.status)}
              </div>
              {index < publication.history.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 mt-2" />
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 pb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {event.status}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.note}</p>
                <p className="text-xs text-gray-500">
                  By <span className="font-medium">{event.actor}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {publication.history.length}
          </p>
          <p className="text-xs text-gray-600">Total Events</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {publication.history.filter((h) => h.status === 'published').length}
          </p>
          <p className="text-xs text-gray-600">Publications</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {publication.history.filter((h) => h.status === 'review').length}
          </p>
          <p className="text-xs text-gray-600">Reviews</p>
        </div>
      </div>
    </div>
  )
}

