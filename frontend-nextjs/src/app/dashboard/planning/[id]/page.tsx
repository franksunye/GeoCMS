'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, FileText } from 'lucide-react'

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id

  // Mock plan data
  const mockPlans: Record<string, any> = {
    '1': {
      id: 1,
      title: 'Content Strategy Planning',
      status: 'in_progress',
      description: 'Comprehensive content strategy for Q1 2025',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-24T14:30:00Z',
      owner: 'Marketing Team',
      content: 'This is a detailed content strategy plan for the upcoming quarter. It includes target audience analysis, content calendar, and distribution strategy.',
    },
    '2': {
      id: 2,
      title: 'Q1 Marketing Campaign',
      status: 'completed',
      description: 'Q1 integrated marketing campaign',
      created_at: '2025-01-10T09:00:00Z',
      updated_at: '2025-01-20T16:45:00Z',
      owner: 'Campaign Manager',
      content: 'Successfully completed Q1 marketing campaign with 150% ROI increase.',
    },
  }

  const plan = mockPlans[planId as string]

  if (!plan) {
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
          <p className="text-gray-600">Plan not found</p>
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
        Back to Plans
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Title Section */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.title}</h1>
              <p className="text-gray-600">{plan.description}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : plan.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {plan.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 border-b border-gray-200 p-6">
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <User className="h-4 w-4" />
              <span className="text-sm">Owner</span>
            </div>
            <p className="font-medium text-gray-900">{plan.owner}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Created</span>
            </div>
            <p className="font-medium text-gray-900">
              {new Date(plan.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Updated</span>
            </div>
            <p className="font-medium text-gray-900">
              {new Date(plan.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700">{plan.content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

