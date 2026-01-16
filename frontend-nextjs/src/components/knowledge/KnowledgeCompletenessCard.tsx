'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getScoreColor } from '@/lib/score-thresholds';

interface CompletenessData {
  completeness_score: number;
  filled_required_fields: number;
  total_required_fields: number;
  filled_optional_fields: number;
  total_optional_fields: number;
  missing_fields: string[];
}

interface KnowledgeCompletenessCardProps {
  data: CompletenessData;
  knowledgeId: number;
  knowledgeTopic: string;
}

export function KnowledgeCompletenessCard({
  data,
  knowledgeId,
  knowledgeTopic,
}: KnowledgeCompletenessCardProps) {
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const requiredPercentage = (data.filled_required_fields / data.total_required_fields) * 100;
  const optionalPercentage = (data.filled_optional_fields / data.total_optional_fields) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Content Completeness</CardTitle>
            <CardDescription>Knowledge base content quality evaluation</CardDescription>
          </div>
          <Badge variant={getScoreBadgeVariant(data.completeness_score)}>
            {getScoreLabel(data.completeness_score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Completeness Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(data.completeness_score)}`}>
              {data.completeness_score}%
            </span>
          </div>
          <Progress value={data.completeness_score} className="h-2" />
        </div>

        {/* Required Fields */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Required Fields</span>
            </div>
            <span className="text-sm text-gray-600">
              {data.filled_required_fields} / {data.total_required_fields}
            </span>
          </div>
          <Progress value={requiredPercentage} className="h-2" />
        </div>

        {/* Optional Fields */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Optional Fields</span>
            </div>
            <span className="text-sm text-gray-600">
              {data.filled_optional_fields} / {data.total_optional_fields}
            </span>
          </div>
          <Progress value={optionalPercentage} className="h-2" />
        </div>

        {/* Missing Fields */}
        {data.missing_fields.length > 0 && (
          <div className="space-y-2 rounded-lg bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Missing Required Fields</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.missing_fields.map((field) => (
                <Badge key={field} variant="outline" className="bg-white text-red-700">
                  {field}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-red-700">
              Add these fields to improve content completeness and usability.
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-2 rounded-lg bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-900">Recommendations</p>
          <ul className="space-y-1 text-xs text-blue-800">
            {data.completeness_score < 60 && (
              <li>• Focus on filling all required fields first</li>
            )}
            {data.missing_fields.length > 0 && (
              <li>• Add missing fields: {data.missing_fields.slice(0, 2).join(', ')}</li>
            )}
            {data.filled_optional_fields < data.total_optional_fields && (
              <li>• Consider adding optional fields for better context</li>
            )}
            {data.completeness_score >= 80 && (
              <li>• ✓ Excellent! This knowledge is well-documented</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

