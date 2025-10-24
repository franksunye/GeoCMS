'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, TrendingUp } from 'lucide-react';

interface Milestone {
  id: number;
  title: string;
  completed: boolean;
  dueDate?: string;
  progress?: number;
}

interface ProgressVisualizationProps {
  milestones: Milestone[];
  totalProgress: number;
  completedCount: number;
  totalCount: number;
}

export function ProgressVisualization({
  milestones,
  totalProgress,
  completedCount,
  totalCount,
}: ProgressVisualizationProps) {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 80) return 'On Track';
    if (progress >= 60) return 'Good Progress';
    if (progress >= 40) return 'In Progress';
    return 'Behind Schedule';
  };

  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Progress</CardTitle>
          <CardDescription>Overall completion status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Completion</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getProgressColor(totalProgress).replace('bg-', 'text-')}`}>
                  {totalProgress}%
                </span>
                <Badge variant="outline">{getProgressLabel(totalProgress)}</Badge>
              </div>
            </div>
            <Progress value={totalProgress} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalCount - completedCount}</p>
              <p className="text-xs text-gray-600">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{totalCount}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>

          {/* Velocity Chart */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Completion Rate</p>
            <div className="flex items-end gap-1 h-16">
              {[65, 72, 78, 85, 92, 100].map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${(value / 100) * 100}%` }}
                  title={`Week ${index + 1}: ${value}%`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Week 1</span>
              <span>Week 6</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestones</CardTitle>
          <CardDescription>{completedCount} of {totalCount} completed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">No milestones set</p>
              </div>
            ) : (
              milestones.map((milestone, index) => (
                <div key={milestone.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    {milestone.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          milestone.completed
                            ? 'text-gray-600 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {milestone.title}
                      </p>
                      {milestone.dueDate && (
                        <p className="text-xs text-gray-600 mt-1">{milestone.dueDate}</p>
                      )}
                    </div>
                  </div>

                  {milestone.progress !== undefined && !milestone.completed && (
                    <div className="ml-8 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{milestone.progress}%</span>
                      </div>
                      <Progress value={milestone.progress} className="h-1" />
                    </div>
                  )}

                  {index < milestones.length - 1 && (
                    <div className="ml-2.5 h-4 border-l-2 border-gray-200" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Progress Insights</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>
                  • Current velocity: {Math.round(completionPercentage / 6)}% per week
                </li>
                <li>
                  • Estimated completion: {Math.ceil((100 - totalProgress) / (completionPercentage / 6))} weeks
                </li>
                <li>
                  • {completedCount} milestone(s) completed
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

