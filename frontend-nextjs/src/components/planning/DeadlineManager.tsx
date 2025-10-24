'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from 'date-fns';

interface DeadlineItem {
  id: number;
  title: string;
  deadline: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'high' | 'medium' | 'low';
}

interface DeadlineManagerProps {
  items: DeadlineItem[];
  onUpdateDeadline?: (itemId: number, newDeadline: string) => void;
  onExtendDeadline?: (itemId: number, days: number) => void;
}

export function DeadlineManager({
  items,
  onUpdateDeadline,
  onExtendDeadline,
}: DeadlineManagerProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getDeadlineStatus = (deadline: string, status: string) => {
    if (status === 'done') return 'completed';
    if (isPast(new Date(deadline))) return 'overdue';
    if (isToday(new Date(deadline))) return 'today';
    if (isTomorrow(new Date(deadline))) return 'tomorrow';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'today':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'tomorrow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'today':
        return 'Due Today';
      case 'tomorrow':
        return 'Due Tomorrow';
      case 'completed':
        return 'Completed';
      default:
        return 'Upcoming';
    }
  };

  // Group items by deadline status
  const groupedItems = {
    overdue: items.filter((item) => getDeadlineStatus(item.deadline, item.status) === 'overdue'),
    today: items.filter((item) => getDeadlineStatus(item.deadline, item.status) === 'today'),
    tomorrow: items.filter((item) => getDeadlineStatus(item.deadline, item.status) === 'tomorrow'),
    upcoming: items.filter((item) => getDeadlineStatus(item.deadline, item.status) === 'upcoming'),
    completed: items.filter((item) => getDeadlineStatus(item.deadline, item.status) === 'completed'),
  };

  const renderDeadlineGroup = (
    groupName: string,
    groupItems: DeadlineItem[],
    groupStatus: string
  ) => {
    if (groupItems.length === 0) return null;

    return (
      <div key={groupName} className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {getStatusIcon(groupStatus)}
          {getStatusLabel(groupStatus)} ({groupItems.length})
        </h4>
        <div className="space-y-2">
          {groupItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-3 space-y-2 ${getStatusColor(groupStatus)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {format(new Date(item.deadline), 'MMM dd, yyyy')} •{' '}
                    {formatDistanceToNow(new Date(item.deadline), { addSuffix: true })}
                  </p>
                </div>
                {item.priority && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      item.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.priority}
                  </Badge>
                )}
              </div>

              {expandedId === item.id && (
                <div className="flex gap-2 pt-2 border-t border-current border-opacity-20">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => onExtendDeadline?.(item.id, 1)}
                  >
                    +1 day
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => onExtendDeadline?.(item.id, 3)}
                  >
                    +3 days
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => onExtendDeadline?.(item.id, 7)}
                  >
                    +1 week
                  </Button>
                </div>
              )}

              <button
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                className="text-xs opacity-75 hover:opacity-100 transition-opacity"
              >
                {expandedId === item.id ? 'Hide options' : 'Extend deadline'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deadline Manager</CardTitle>
        <CardDescription>Track and manage your content deadlines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No deadlines set</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderDeadlineGroup('overdue', groupedItems.overdue, 'overdue')}
            {renderDeadlineGroup('today', groupedItems.today, 'today')}
            {renderDeadlineGroup('tomorrow', groupedItems.tomorrow, 'tomorrow')}
            {renderDeadlineGroup('upcoming', groupedItems.upcoming, 'upcoming')}
            {renderDeadlineGroup('completed', groupedItems.completed, 'completed')}
          </div>
        )}

        {/* Summary Stats */}
        {items.length > 0 && (
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-gray-50 p-3 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{groupedItems.overdue.length}</p>
              <p className="text-xs text-gray-600">Overdue</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{groupedItems.today.length}</p>
              <p className="text-xs text-gray-600">Today</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{groupedItems.upcoming.length}</p>
              <p className="text-xs text-gray-600">Upcoming</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{groupedItems.completed.length}</p>
              <p className="text-xs text-gray-600">Done</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

