'use client'

import { useState } from 'react'
import { Plan } from '@/types'
import { GripVertical, Calendar, Tag, Target } from 'lucide-react'

interface KanbanBoardProps {
  plans: Plan[]
  onStatusChange: (planId: number, newStatus: Plan['status']) => void
}

const statusColumns: { status: Plan['status']; label: string; color: string }[] = [
  { status: 'pending_materials', label: 'Pending Materials', color: 'bg-yellow-100 border-yellow-300' },
  { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 border-blue-300' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-purple-100 border-purple-300' },
  { status: 'completed', label: 'Completed', color: 'bg-green-100 border-green-300' },
]

export function KanbanBoard({ plans, onStatusChange }: KanbanBoardProps) {
  const [draggedPlan, setDraggedPlan] = useState<Plan | null>(null)

  const getPlansByStatus = (status: Plan['status']) => {
    return plans.filter(p => p.status === status)
  }

  const handleDragStart = (plan: Plan) => {
    setDraggedPlan(plan)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: Plan['status']) => {
    if (draggedPlan && draggedPlan.status !== status) {
      onStatusChange(draggedPlan.id, status)
    }
    setDraggedPlan(null)
  }

  const getProgressPercentage = (plan: Plan) => {
    const statusIndex = statusColumns.findIndex(col => col.status === plan.status)
    return ((statusIndex + 1) / statusColumns.length) * 100
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((column) => {
        const columnPlans = getPlansByStatus(column.status)
        
        return (
          <div
            key={column.status}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.status)}
          >
            {/* Column Header */}
            <div className={`${column.color} border-2 rounded-t-lg p-4`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-700 bg-white rounded-full">
                  {columnPlans.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className="bg-gray-50 border-2 border-t-0 border-gray-200 rounded-b-lg p-4 min-h-[500px] space-y-3">
              {columnPlans.map((plan) => (
                <div
                  key={plan.id}
                  draggable
                  onDragStart={() => handleDragStart(plan)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                >
                  {/* Drag Handle */}
                  <div className="flex items-start gap-2 mb-3">
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{plan.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.topic}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(getProgressPercentage(plan))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(plan)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2">
                    {/* Category */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{plan.category}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(plan.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>

                    {/* Target Metrics */}
                    {Object.keys(plan.target_metric).length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Target className="h-3.5 w-3.5" />
                        <span>
                          {Object.entries(plan.target_metric)[0][0]}: {Object.entries(plan.target_metric)[0][1]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {plan.tags && plan.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {plan.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {plan.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          +{plan.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {columnPlans.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  拖拽任务到这里
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

