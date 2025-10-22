'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Plan } from '@/types'
import { FileText } from 'lucide-react'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { CreatePlanDialog } from '@/components/planning/create-plan-dialog'

export default function PlanningPage() {
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await axios.get('/api/plans')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">内容策划</h1>
          <p className="mt-2 text-gray-600">管理内容计划和策略</p>
        </div>
        <CreatePlanDialog />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
                <span className="text-xs text-gray-500">{plan.category}</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {plan.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {plan.topic}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {plan.keywords.slice(0, 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                更新于 {formatRelativeTime(plan.updated_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无策划</h3>
          <p className="mt-1 text-sm text-gray-500">
            开始创建您的第一个内容计划
          </p>
        </div>
      )}
    </div>
  )
}

