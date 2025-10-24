'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle, Archive } from 'lucide-react'
import axios from 'axios'
import PublishingStateFlow from './PublishingStateFlow'
import PublishingChecklist from './PublishingChecklist'
import PublishingHistory from './PublishingHistory'

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

export default function PublishingWorkflow() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'history'>(
    'overview'
  )

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const response = await axios.get('/api/publishing')
        setPublications(response.data.data || [])
        if (response.data.data && response.data.data.length > 0) {
          setSelectedId(response.data.data[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch publications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublications()
  }, [])

  const selected = publications.find((p) => p.id === selectedId)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'review':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'archived':
        return <Archive className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-50 border-green-200'
      case 'review':
        return 'bg-yellow-50 border-yellow-200'
      case 'archived':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Publishing Management</h1>
        <p className="mt-2 text-gray-600">
          Manage content publishing workflow and schedule
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading publications...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Publications List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow space-y-2 max-h-96 overflow-y-auto">
              {publications.map((pub) => (
                <button
                  key={pub.id}
                  onClick={() => setSelectedId(pub.id)}
                  className={`w-full text-left p-4 border-l-4 transition-colors ${
                    selectedId === pub.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(pub.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {pub.draftTitle}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {pub.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Publication Details */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-6">
                {/* Status Card */}
                <div
                  className={`border rounded-lg p-6 ${getStatusColor(selected.status)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      {selected.draftTitle}
                    </h2>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full text-sm font-medium capitalize">
                      {getStatusIcon(selected.status)}
                      {selected.status}
                    </span>
                  </div>

                  {/* Publishing Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selected.publishedAt && (
                      <div>
                        <p className="text-gray-600">Published</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selected.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selected.scheduledAt && (
                      <div>
                        <p className="text-gray-600">Scheduled</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selected.scheduledAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selected.channels && selected.channels.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-gray-600 mb-2">Channels</p>
                        <div className="flex flex-wrap gap-2">
                          {selected.channels.map((channel) => (
                            <span
                              key={channel}
                              className="inline-block px-2 py-1 bg-white rounded text-xs font-medium capitalize"
                            >
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                  <div className="border-b border-gray-200 flex">
                    {['overview', 'checklist', 'history'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() =>
                          setActiveTab(tab as 'overview' | 'checklist' | 'history')
                        }
                        className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <PublishingStateFlow publication={selected} />
                    )}
                    {activeTab === 'checklist' && (
                      <PublishingChecklist publication={selected} />
                    )}
                    {activeTab === 'history' && (
                      <PublishingHistory publication={selected} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">Select a publication to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

