'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Star } from 'lucide-react';

interface Recommendation {
  knowledge_id: number;
  topic: string;
  description?: string;
  relevance_score: number;
  reason?: string;
  quality_score: number;
}

interface KnowledgeRecommendationsProps {
  recommendations: Recommendation[];
  taskType: string;
  onSelect?: (knowledgeId: number) => void;
}

export function KnowledgeRecommendations({
  recommendations,
  taskType,
  onSelect,
}: KnowledgeRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Knowledge</CardTitle>
          <CardDescription>For {taskType} tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No recommendations available for this task type</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getQualityStars = (score: number) => {
    return Math.round(score / 20);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recommended Knowledge</CardTitle>
            <CardDescription>For {taskType} tasks</CardDescription>
          </div>
          <Badge variant="outline">{recommendations.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.knowledge_id}
              className="flex items-start justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{rec.topic}</h4>
                  <Badge className={getRelevanceColor(rec.relevance_score)}>
                    {rec.relevance_score}% match
                  </Badge>
                </div>
                {rec.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{rec.description}</p>
                )}
                <div className="flex items-center gap-3">
                  {rec.reason && (
                    <p className="text-xs text-gray-500 italic">{rec.reason}</p>
                  )}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < getQualityStars(rec.quality_score)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      {rec.quality_score}
                    </span>
                  </div>
                </div>
              </div>
              {onSelect && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelect(rec.knowledge_id)}
                  className="ml-2"
                >
                  Use
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">Smart Recommendations</p>
              <p>
                These knowledge items are recommended based on task type and relevance analysis.
                Higher match scores indicate better fit for your current task.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

