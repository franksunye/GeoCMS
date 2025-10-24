'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Lightbulb } from 'lucide-react';

interface MissingKnowledge {
  knowledge_type: string;
  reason: string;
  suggested_fields: string[];
}

interface MissingKnowledgeDetectionProps {
  missingItems: MissingKnowledge[];
  prompt: string;
  onAddKnowledge?: (knowledgeType: string) => void;
}

export function MissingKnowledgeDetection({
  missingItems,
  prompt,
  onAddKnowledge,
}: MissingKnowledgeDetectionProps) {
  if (missingItems.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Lightbulb className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">All Required Knowledge Available</AlertTitle>
        <AlertDescription className="text-green-800">
          Your knowledge base has all the information needed for this task.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Missing Knowledge Detected</AlertTitle>
        <AlertDescription>
          Your knowledge base is missing {missingItems.length} type(s) of information needed for
          this task. Consider adding them to improve content quality.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        {missingItems.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-red-900">{item.knowledge_type}</h4>
                <p className="text-xs text-red-700 mt-1">{item.reason}</p>
              </div>
              {onAddKnowledge && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddKnowledge(item.knowledge_type)}
                  className="ml-2 flex-shrink-0"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {item.suggested_fields.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-800">Suggested fields:</p>
                <div className="flex flex-wrap gap-1">
                  {item.suggested_fields.map((field) => (
                    <Badge
                      key={field}
                      variant="outline"
                      className="bg-white text-red-700 text-xs"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Guidance */}
      <div className="rounded-lg bg-blue-50 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">How to Add Missing Knowledge</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click &quot;Add&quot; button next to the missing knowledge type</li>
              <li>Fill in the suggested fields with relevant information</li>
              <li>Save the knowledge to your knowledge base</li>
              <li>Re-run your task to use the newly added knowledge</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-700 mb-2">Analysis Summary</p>
        <p className="text-xs text-gray-600">
          Based on your prompt: <span className="italic">&quot;{prompt.substring(0, 100)}&quot;...</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          System detected {missingItems.length} missing knowledge type(s) that would improve
          content quality and relevance.
        </p>
      </div>
    </div>
  );
}

