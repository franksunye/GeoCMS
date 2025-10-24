'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OutdatedKnowledge {
  id: number;
  topic: string;
  description?: string;
  updated_at: string;
  days_since_update: number;
  reference_count: number;
}

interface KnowledgeExpirationWarningProps {
  outdatedItems: OutdatedKnowledge[];
  onRefresh?: (id: number) => void;
}

export function KnowledgeExpirationWarning({
  outdatedItems,
  onRefresh,
}: KnowledgeExpirationWarningProps) {
  if (outdatedItems.length === 0) {
    return null;
  }

  const criticalItems = outdatedItems.filter((item) => item.days_since_update > 180);
  const warningItems = outdatedItems.filter(
    (item) => item.days_since_update > 90 && item.days_since_update <= 180
  );

  const getUrgencyBadge = (daysSinceUpdate: number) => {
    if (daysSinceUpdate > 180) return { variant: 'destructive' as const, label: 'Critical' };
    if (daysSinceUpdate > 90) return { variant: 'secondary' as const, label: 'Warning' };
    return { variant: 'outline' as const, label: 'Attention' };
  };

  return (
    <div className="space-y-4">
      {criticalItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical: Outdated Knowledge</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              {criticalItems.length} knowledge item(s) haven't been updated for over 6 months.
              Consider reviewing and updating them.
            </p>
            <div className="space-y-2">
              {criticalItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded bg-red-50 p-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{item.topic}</p>
                    <p className="text-xs text-red-700">
                      Last updated {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  {onRefresh && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRefresh(item.id)}
                      className="ml-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warningItems.length > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Warning: Knowledge Needs Review</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              {warningItems.length} knowledge item(s) haven't been updated for 3-6 months.
            </p>
            <div className="space-y-2">
              {warningItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded bg-yellow-50 p-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">{item.topic}</p>
                    <p className="text-xs text-yellow-700">
                      Last updated {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  {onRefresh && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRefresh(item.id)}
                      className="ml-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{criticalItems.length}</p>
          <p className="text-xs text-gray-600">Critical</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{warningItems.length}</p>
          <p className="text-xs text-gray-600">Warning</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{outdatedItems.length}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
      </div>
    </div>
  );
}

