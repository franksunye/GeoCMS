'use client'

import { useState, useEffect } from 'react'
import { Draft, Plan, Knowledge } from '@/types'
import { Link2, FileText, BookOpen, Loader } from 'lucide-react'
import axios from 'axios'

interface RelatedContentPanelProps {
  draftId: number
  keywords: string[]
}

interface RelatedContent {
  drafts: Draft[]
  plans: Plan[]
  knowledge: Knowledge[]
}

export default function RelatedContentPanel({
  draftId,
  keywords,
}: RelatedContentPanelProps) {
  const [relatedContent, setRelatedContent] = useState<RelatedContent>({
    drafts: [],
    plans: [],
    knowledge: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedContent = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(`/api/drafts/${draftId}/related`, {
          params: { keywords: keywords.join(',') },
        })
        setRelatedContent(response.data)
      } catch (error) {
        console.error('Error fetching related content:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (keywords.length > 0) {
      fetchRelatedContent()
    }
  }, [draftId, keywords])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-5 w-5 text-gray-400 animate-spin" />
      </div>
    )
  }

  const totalRelated =
    relatedContent.drafts.length +
    relatedContent.plans.length +
    relatedContent.knowledge.length

  if (totalRelated === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Link2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No related content found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Related Drafts */}
      {relatedContent.drafts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Related Drafts ({relatedContent.drafts.length})
          </h4>
          <div className="space-y-2">
            {relatedContent.drafts.map((draft) => (
              <a
                key={draft.id}
                href={`/dashboard/drafts/${draft.id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  {draft.metadata.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {draft.metadata.word_count} words
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Plans */}
      {relatedContent.plans.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            Related Plans ({relatedContent.plans.length})
          </h4>
          <div className="space-y-2">
            {relatedContent.plans.map((plan) => (
              <a
                key={plan.id}
                href={`/dashboard/planning/${plan.id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  {plan.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: <span className="capitalize">{plan.status}</span>
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Knowledge */}
      {relatedContent.knowledge.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-green-600" />
            Related Knowledge ({relatedContent.knowledge.length})
          </h4>
          <div className="space-y-2">
            {relatedContent.knowledge.map((knowledge) => (
              <a
                key={knowledge.id}
                href={`/dashboard/knowledge/${knowledge.id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  {knowledge.topic}
                </p>
                {knowledge.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {knowledge.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

