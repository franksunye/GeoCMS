'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  GripVertical,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KanbanCard {
  id: number;
  title: string;
  status: string;
  deadline?: string;
  progress?: number;
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
  tags?: string[];
}

interface KanbanBoardEnhancedProps {
  cards: KanbanCard[];
  onCardMove?: (cardId: number, newStatus: string) => void;
  onCardClick?: (cardId: number) => void;
  onAddCard?: (status: string) => void;
}

export function KanbanBoardEnhanced({
  cards,
  onCardMove,
  onCardClick,
  onAddCard,
}: KanbanBoardEnhancedProps) {
  const [draggedCard, setDraggedCard] = useState<number | null>(null);

  const statuses = ['todo', 'in_progress', 'done'];
  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };

  const statusIcons = {
    todo: Circle,
    in_progress: Clock,
    done: CheckCircle2,
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getCardsByStatus = (status: string) => {
    return cards.filter((card) => card.status === status);
  };

  const handleDragStart = (e: React.DragEvent, cardId: number) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedCard) {
      onCardMove?.(draggedCard, newStatus);
      setDraggedCard(null);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statuses.map((status) => {
          const StatusIcon = statusIcons[status as keyof typeof statusIcons];
          const statusCards = getCardsByStatus(status);
          const completionRate =
            status === 'done'
              ? Math.round((statusCards.length / Math.max(cards.length, 1)) * 100)
              : 0;

          return (
            <div
              key={status}
              className="flex flex-col rounded-lg border border-gray-200 bg-gray-50"
            >
              {/* Column Header */}
              <div className="border-b border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">
                      {statusLabels[status as keyof typeof statusLabels]}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {statusCards.length}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddCard?.(status)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {status === 'done' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-1" />
                  </div>
                )}
              </div>

              {/* Cards Container */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {statusCards.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-xs text-gray-500">No items yet</p>
                  </div>
                ) : (
                  statusCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => onCardClick?.(card.id)}
                      className="group cursor-move rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <GripVertical className="h-3 w-3 text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {card.title}
                          </h4>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {card.progress !== undefined && (
                        <div className="mb-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{card.progress}%</span>
                          </div>
                          <Progress value={card.progress} className="h-1" />
                        </div>
                      )}

                      {/* Deadline */}
                      {card.deadline && (
                        <div
                          className={`flex items-center gap-1 text-xs mb-2 ${
                            isOverdue(card.deadline)
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {isOverdue(card.deadline) ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : (
                            <Calendar className="h-3 w-3" />
                          )}
                          <span>
                            {formatDistanceToNow(new Date(card.deadline), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      )}

                      {/* Tags and Priority */}
                      <div className="flex flex-wrap gap-1">
                        {card.priority && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(card.priority)}`}
                          >
                            {card.priority}
                          </Badge>
                        )}
                        {card.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {card.tags && card.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{card.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

