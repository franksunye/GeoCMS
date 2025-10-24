'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, User, Calendar } from 'lucide-react'

export default function KnowledgeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const knowledgeId = params.id

  // Mock knowledge data
  const mockKnowledge: Record<string, any> = {
    '1': {
      id: 1,
      topic: 'AI Content Generation Best Practices',
      description: 'Guidelines for using AI tools effectively',
      content:
        'AI content generation has become a critical skill for modern marketers. Here are the best practices:\n\n1. Always review AI-generated content\n2. Maintain brand voice consistency\n3. Use multiple AI tools for comparison\n4. Fact-check all claims\n5. Optimize for SEO\n\nThese practices ensure high-quality, reliable content.',
      category: 'AI & Technology',
      created_at: '2025-01-10T08:00:00Z',
      updated_at: '2025-01-22T11:30:00Z',
      author: 'Content Team',
    },
    '2': {
      id: 2,
      topic: 'Content Marketing ROI Metrics',
      description: 'How to measure content marketing success',
      content:
        'Measuring content marketing ROI is essential for demonstrating value. Key metrics include:\n\n- Traffic growth\n- Lead generation\n- Conversion rates\n- Customer acquisition cost\n- Lifetime value\n- Engagement metrics\n\nTrack these metrics consistently to optimize your content strategy.',
      category: 'Content Marketing',
      created_at: '2025-01-12T09:15:00Z',
      updated_at: '2025-01-23T14:20:00Z',
      author: 'Analytics Team',
    },
  }

  const knowledge = mockKnowledge[knowledgeId as string]

  if (!knowledge) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Knowledge article not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge Base
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Title Section */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{knowledge.topic}</h1>
              <p className="text-gray-600">{knowledge.description}</p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 border-b border-gray-200 p-6 bg-gray-50">
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <User className="h-4 w-4" />
              <span className="text-sm">Author</span>
            </div>
            <p className="font-medium text-gray-900">{knowledge.author}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Created</span>
            </div>
            <p className="font-medium text-gray-900">
              {new Date(knowledge.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">Category</span>
            </div>
            <p className="font-medium text-gray-900">{knowledge.category}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{knowledge.content}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

