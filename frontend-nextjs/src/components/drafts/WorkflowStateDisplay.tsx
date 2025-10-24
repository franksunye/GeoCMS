'use client'

import { WorkflowState } from '@/types'
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react'

interface WorkflowStateDisplayProps {
  workflowState: WorkflowState
}

const WORKFLOW_STAGES = ['draft', 'review', 'approved', 'published'] as const

const getStageIcon = (stage: string, isCompleted: boolean, isCurrent: boolean) => {
  if (isCompleted) {
    return <CheckCircle className="h-6 w-6 text-green-600" />
  }
  if (isCurrent) {
    return <Circle className="h-6 w-6 text-blue-600 animate-pulse" />
  }
  return <Circle className="h-6 w-6 text-gray-300" />
}

const getStageLabel = (stage: string): string => {
  return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')
}

export default function WorkflowStateDisplay({ workflowState }: WorkflowStateDisplayProps) {
  const currentStageIndex = WORKFLOW_STAGES.indexOf(workflowState.current_stage as any)

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Overall Progress</h3>
          <span className="text-sm font-medium text-gray-600">
            {workflowState.progress_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${workflowState.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Workflow Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Workflow Status</h3>
        <div className="space-y-3">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            const stageHistory = workflowState.stage_history.find((h) => h.stage === stage)

            return (
              <div key={stage}>
                <div className="flex items-center gap-3">
                  {getStageIcon(stage, isCompleted, isCurrent)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isCurrent
                            ? 'text-blue-600'
                            : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {getStageLabel(stage)}
                      </span>
                      {stageHistory && (
                        <span className="text-xs text-gray-500">
                          {new Date(stageHistory.entered_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {stageHistory && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {stageHistory.actor}
                        {stageHistory.exited_at && (
                          <span>
                            {' '}
                            • Exited: {new Date(stageHistory.exited_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {index < WORKFLOW_STAGES.length - 1 && (
                  <div className="ml-3 h-6 border-l-2 border-gray-200" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Estimated Time */}
      {workflowState.estimated_completion_time && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Estimated Completion</p>
            <p className="text-sm text-blue-700 mt-1">
              {workflowState.estimated_completion_time}
            </p>
          </div>
        </div>
      )}

      {/* Stage History */}
      {workflowState.stage_history.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Stage History
          </h4>
          <div className="space-y-2">
            {workflowState.stage_history.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <span>
                  <span className="font-medium">{getStageLabel(entry.stage)}</span>
                  {' '}by {entry.actor}
                </span>
                <span>{new Date(entry.entered_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

