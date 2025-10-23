'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plan } from '@/types'
import { FileText, LayoutGrid, List } from 'lucide-react'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { CreatePlanDialog } from '@/components/planning/create-plan-dialog'
import { KanbanBoard } from '@/components/planning/KanbanBoard'
import { useToast } from '@/hooks/use-toast'
import { KanbanSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { ErrorDisplay } from '@/components/ui/error-boundary'
import AgentAvatar from '@/components/team/AgentAvatar'
import AgentBadge from '@/components/team/AgentBadge'

export default function PlanningPage() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: plans, isLoading, error, refetch } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await axios.get('/api/plans')
      return response.data
    },
    retry: 2,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ planId, status }: { planId: number; status: Plan['status'] }) => {
      await axios.patch(`/api/plans/${planId}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast({
        title: 'Status Updated',
        description: 'Plan status has been successfully updated',
      })
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating plan status',
        variant: 'destructive',
      })
    },
  })

  const handleStatusChange = (planId: number, newStatus: Plan['status']) => {
    updateStatusMutation.mutate({ planId, status: newStatus })
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Planning</h1>
          <p className="mt-2 text-gray-600">Manage content plans and strategies</p>
        </div>
        {viewMode === 'kanban' ? <KanbanSkeleton /> : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Planning</h1>
          <p className="mt-2 text-gray-600">Manage content plans and strategies</p>
        </div>
        <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Planning</h1>
          <p className="mt-2 text-gray-600">Manage content plans and strategies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban View
            </button>
          </div>
          <CreatePlanDialog />
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard plans={plans || []} onStatusChange={handleStatusChange} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan) => (
          <div
            key={plan.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <AgentAvatar agentId="planner" size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                    <span className="text-xs text-gray-500">{plan.category}</span>
                  </div>
                  <AgentBadge agentId="planner" size="sm" />
                </div>
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
                Updated {formatRelativeTime(plan.updated_at)}
              </div>
            </div>
          </div>
            ))}
          </div>

          {plans?.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Plans</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start creating your first content plan
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

