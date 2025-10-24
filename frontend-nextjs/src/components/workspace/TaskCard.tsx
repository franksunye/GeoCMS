'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InboxItem } from '@/types'
import { useWorkspaceStore } from '@/lib/stores/workspace-store'
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

interface TaskCardProps {
  task: InboxItem
  variant?: 'compact' | 'detailed'
  showActions?: boolean
}

export function TaskCard({ task, variant = 'compact', showActions = true }: TaskCardProps) {
  const { markAsRead, removeInboxItem, setInboxOpen } = useWorkspaceStore()
  const { toast } = useToast()
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/50'
      case 'high':
        return 'border-l-yellow-500 bg-yellow-50/50'
      case 'normal':
        return 'border-l-blue-500 bg-blue-50/50'
      case 'low':
        return 'border-l-gray-500 bg-gray-50/50'
      default:
        return 'border-l-gray-300'
    }
  }
  
  const getTypeIcon = () => {
    switch (task.type) {
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'feedback':
        return <Eye className="h-4 w-4 text-purple-600" />
      case 'alert':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'suggestion':
        return <span className="text-sm">💡</span>
      default:
        return null
    }
  }
  
  const handleApprove = async () => {
    toast({
      title: '操作成功',
      description: '已批准该项目',
    })
    removeInboxItem(task.id)
  }
  
  const handleReject = async () => {
    toast({
      title: '操作成功',
      description: '已拒绝该项目',
      variant: 'destructive',
    })
    removeInboxItem(task.id)
  }
  
  const handleViewDetails = () => {
    markAsRead(task.id)
    setInboxOpen(false)
    
    // Navigate to related entity
    const { type, id } = task.relatedEntity
    if (id) {
      switch (type) {
        case 'draft':
          window.location.href = `/dashboard/drafts?id=${id}`
          break
        case 'plan':
          window.location.href = `/dashboard/planning?id=${id}`
          break
        case 'knowledge':
          window.location.href = `/dashboard/knowledge?id=${id}`
          break
        case 'task':
          window.location.href = `/dashboard/tasks?id=${id}`
          break
      }
    }
  }
  
  const handleApplySuggestion = async () => {
    toast({
      title: '已应用建议',
      description: 'AI 建议已应用到内容中',
    })
    removeInboxItem(task.id)
  }
  
  const handleIgnore = () => {
    removeInboxItem(task.id)
  }
  
  return (
    <Card className={`p-3 border-l-4 ${getPriorityColor()} transition-all hover:shadow-md`}>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="mt-0.5">{getTypeIcon()}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
              {task.title}
            </h4>
            {task.description && variant === 'detailed' && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(task.createdAt, { 
              addSuffix: true,
              locale: zhCN 
            })}
          </span>
          {task.dueDate && (
            <>
              <span>•</span>
              <span className="text-red-600">
                截止 {formatDistanceToNow(task.dueDate, { locale: zhCN })}
              </span>
            </>
          )}
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-1">
            {task.type === 'approval' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 h-8"
                  onClick={handleApprove}
                >
                  批准
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 h-8"
                  onClick={handleReject}
                >
                  拒绝
                </Button>
              </>
            )}
            
            {task.type === 'feedback' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 h-8"
                  onClick={handleViewDetails}
                >
                  添加反馈
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8"
                  onClick={handleViewDetails}
                >
                  查看
                </Button>
              </>
            )}
            
            {task.type === 'suggestion' && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 h-8"
                  onClick={handleApplySuggestion}
                >
                  应用
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8"
                  onClick={handleIgnore}
                >
                  忽略
                </Button>
              </>
            )}
            
            {task.type === 'alert' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-8"
                onClick={handleViewDetails}
              >
                查看详情
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

