'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Draft } from '@/types'
import { PenTool, Eye } from 'lucide-react'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { useState } from 'react'

export default function DraftsPage() {
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)

  const { data: drafts, isLoading } = useQuery<Draft[]>({
    queryKey: ['drafts'],
    queryFn: async () => {
      const response = await axios.get('/api/drafts')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Draft Management</h1>
        <p className="mt-2 text-gray-600">View and edit content drafts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drafts List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {drafts?.map((draft) => (
                <div
                  key={draft.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedDraft?.id === draft.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(draft.status)}`}>
                      {draft.status}
                    </span>
                    <span className="text-xs text-gray-500">v{draft.version}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {draft.metadata.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {draft.metadata.word_count} words · {draft.metadata.estimated_reading_time}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(draft.updated_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Draft Preview */}
        <div className="lg:col-span-2">
          {selectedDraft ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedDraft.metadata.title}
                </h2>
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </button>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedDraft.metadata.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="prose max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                  <pre className="whitespace-pre-wrap text-sm">
                    {selectedDraft.content}
                  </pre>
                </div>
              </div>
              {selectedDraft.reviewer_feedback && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-1">
                    Review Feedback
                  </h4>
                  <p className="text-sm text-yellow-700">
                    {selectedDraft.reviewer_feedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <PenTool className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Select a Draft
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a draft from the left list to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {drafts?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <PenTool className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Drafts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start from content planning to generate your first draft
          </p>
        </div>
      )}
    </div>
  )
}

