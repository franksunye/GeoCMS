'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Draft } from '@/types'
import { PenTool, Eye, Zap, Brain, CheckCircle, Link2 } from 'lucide-react'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { useState } from 'react'
import AgentAvatar from '@/components/team/AgentAvatar'
import AgentBadge from '@/components/team/AgentBadge'
import QualityScoreCard from '@/components/drafts/QualityScoreCard'
import ReasoningPanel from '@/components/drafts/ReasoningPanel'
import WorkflowStateDisplay from '@/components/drafts/WorkflowStateDisplay'
import PreviewPanel from '@/components/drafts/PreviewPanel'
import CategoryTagSelector from '@/components/drafts/CategoryTagSelector'
import RelatedContentPanel from '@/components/drafts/RelatedContentPanel'
import BulkOperations from '@/components/drafts/BulkOperations'

export default function DraftsPage() {
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'quality' | 'reasoning' | 'workflow' | 'metadata' | 'related'>('preview')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectedDraftIds, setSelectedDraftIds] = useState<number[]>([])

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
                  className={`p-4 cursor-pointer hover:bg-gray-50 flex items-start gap-3 ${
                    selectedDraft?.id === draft.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDraftIds.includes(draft.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      setSelectedDraftIds(
                        e.target.checked
                          ? [...selectedDraftIds, draft.id]
                          : selectedDraftIds.filter((id) => id !== draft.id)
                      )
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <AgentAvatar agentId="writer" size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(draft.status)}`}>
                            {draft.status}
                          </span>
                          <span className="text-xs text-gray-500">v{draft.version}</span>
                        </div>
                        <AgentBadge agentId="writer" size="sm" />
                      </div>
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Draft Details */}
        <div className="lg:col-span-2">
          {selectedDraft ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <AgentAvatar agentId="writer" size="lg" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedDraft.metadata.title}
                    </h2>
                    <AgentBadge agentId="writer" size="sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {selectedDraft.metadata.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(selectedDraft.status)}`}>
                    {selectedDraft.status}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex overflow-x-auto">
                  {[
                    { id: 'preview', label: 'Preview', icon: Eye },
                    { id: 'quality', label: 'Quality', icon: Zap },
                    { id: 'reasoning', label: 'Reasoning', icon: Brain },
                    { id: 'workflow', label: 'Workflow', icon: CheckCircle },
                    { id: 'metadata', label: 'Metadata', icon: PenTool },
                    { id: 'related', label: 'Related', icon: Link2 },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'preview' && (
                  <PreviewPanel
                    content={selectedDraft.content}
                    title={selectedDraft.metadata.title}
                    keywords={selectedDraft.metadata.keywords}
                    format={selectedDraft.format}
                  />
                )}

                {activeTab === 'quality' && selectedDraft.quality_score && (
                  <QualityScoreCard qualityScore={selectedDraft.quality_score} />
                )}

                {activeTab === 'quality' && !selectedDraft.quality_score && (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No quality score available</p>
                  </div>
                )}

                {activeTab === 'reasoning' && selectedDraft.agent_reasoning && (
                  <ReasoningPanel reasoning={selectedDraft.agent_reasoning} />
                )}

                {activeTab === 'reasoning' && !selectedDraft.agent_reasoning && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No agent reasoning available</p>
                  </div>
                )}

                {activeTab === 'workflow' && selectedDraft.workflow_state && (
                  <WorkflowStateDisplay workflowState={selectedDraft.workflow_state} />
                )}

                {activeTab === 'workflow' && !selectedDraft.workflow_state && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No workflow state available</p>
                  </div>
                )}

                {activeTab === 'metadata' && (
                  <div className="space-y-6">
                    <CategoryTagSelector
                      selectedCategoryId={selectedCategoryId}
                      selectedTagIds={selectedTagIds}
                      onCategoryChange={setSelectedCategoryId}
                      onTagsChange={setSelectedTagIds}
                    />

                    {selectedDraft.reviewer_feedback && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-900 mb-1">
                          Review Feedback
                        </h4>
                        <p className="text-sm text-yellow-700">
                          {selectedDraft.reviewer_feedback}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Word Count</p>
                        <p className="font-semibold text-gray-900">{selectedDraft.metadata.word_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reading Time</p>
                        <p className="font-semibold text-gray-900">{selectedDraft.metadata.estimated_reading_time}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Version</p>
                        <p className="font-semibold text-gray-900">v{selectedDraft.version}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Updated</p>
                        <p className="font-semibold text-gray-900">{formatRelativeTime(selectedDraft.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'related' && (
                  <RelatedContentPanel
                    draftId={selectedDraft.id}
                    keywords={selectedDraft.metadata.keywords}
                  />
                )}
              </div>
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

      {/* Bulk Operations */}
      <BulkOperations
        selectedIds={selectedDraftIds}
        onSuccess={() => {
          setSelectedDraftIds([])
          // Refetch drafts
        }}
      />
    </div>
  )
}

