'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, Archive, AlertCircle, Eye, Send } from 'lucide-react'
import { Publishing } from '@/types'

export default function PublishingPage() {
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: publishingList = [], isLoading } = useQuery({
    queryKey: ['publishing', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`/api/publishing?${params}`)
      const json = await res.json()
      return json.data || []
    },
  })

  const { data: selectedItem } = useQuery({
    queryKey: ['publishing', selectedId],
    queryFn: async () => {
      if (!selectedId) return null
      const res = await fetch(`/api/publishing/${selectedId}`)
      const json = await res.json()
      return json.data
    },
    enabled: !!selectedId,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="text-green-600" size={20} />
      case 'pending_review':
        return <Clock className="text-yellow-600" size={20} />
      case 'archived':
        return <Archive className="text-gray-600" size={20} />
      default:
        return <AlertCircle className="text-blue-600" size={20} />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      published: 'Published',
      archived: 'Archived',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    await fetch(`/api/publishing/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publishing Management</h1>
          <p className="text-gray-600 mt-1">Manage content publishing workflow and history</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['', 'draft', 'pending_review', 'published', 'archived'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status ? getStatusLabel(status) : 'All'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : publishingList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No content</div>
            ) : (
              <div className="divide-y">
                {publishingList.map((item: Publishing) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedId === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.channel === 'blog' ? '📝 博客' : '🌐 网站'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Draft #{item.draft_id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.updated_at).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedItem ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
                <div className="space-y-2">
                  {['draft', 'pending_review', 'published', 'archived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedItem.id, status)}
                      className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                        selectedItem.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Publishing Checklist</h3>
                <div className="space-y-2">
                  {Object.entries(selectedItem.checklist).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={(e) => {
                          handleStatusChange(selectedItem.id, selectedItem.status)
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {key === 'title_checked' && 'Title Check'}
                        {key === 'keywords_checked' && 'Keywords Check'}
                        {key === 'media_checked' && 'Media Check'}
                        {key === 'content_length_checked' && 'Content Length Check'}
                        {key === 'seo_checked' && 'SEO Check'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Channel */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Publishing Channel</h3>
                <select
                  value={selectedItem.channel}
                  onChange={(e) => handleStatusChange(selectedItem.id, selectedItem.status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="blog">📝 Blog</option>
                  <option value="website">🌐 Website</option>
                  <option value="social">📱 Social Media</option>
                </select>
              </div>

              {/* Publish Time */}
              {selectedItem.status === 'draft' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Publish Time</h3>
                  <input
                    type="datetime-local"
                    defaultValue={selectedItem.publish_time?.slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Publishing History</h3>
                <div className="space-y-2">
                  {selectedItem.history.map((entry: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600 pb-2 border-b last:border-b-0">
                      <p className="font-medium">{getStatusLabel(entry.status)}</p>
                      <p className="text-gray-500">
                        {new Date(entry.timestamp).toLocaleString('en-US')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Eye size={16} />
                  Preview
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Send size={16} />
                  Publish
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
              Select an item to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

