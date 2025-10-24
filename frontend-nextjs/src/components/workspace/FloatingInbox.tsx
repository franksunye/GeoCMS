'use client'

import { useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Inbox, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '@/lib/stores/workspace-store'
import { InboxItem } from '@/types'
import { TaskCard } from './TaskCard'
import inboxData from '@/lib/data/inbox-items.json'

export function FloatingInbox() {
  const { 
    inboxItems, 
    unreadCount, 
    isInboxOpen, 
    setInboxItems,
    setInboxOpen 
  } = useWorkspaceStore()
  
  // Load demo data on mount
  useEffect(() => {
    const items: InboxItem[] = inboxData.map(item => ({
      ...item,
      type: item.type as 'approval' | 'feedback' | 'suggestion' | 'alert',
      priority: item.priority as 'urgent' | 'high' | 'normal' | 'low',
      createdAt: new Date(item.createdAt),
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      relatedEntity: {
        ...item.relatedEntity,
        type: item.relatedEntity.type as 'draft' | 'plan' | 'knowledge' | 'task',
        id: item.relatedEntity.id as string | number
      },
      actions: [] // Will be populated by TaskCard
    }))
    setInboxItems(items)
  }, [setInboxItems])
  
  // Group items by priority
  const groupedItems = {
    urgent: inboxItems.filter(item => item.priority === 'urgent' && !item.isRead),
    high: inboxItems.filter(item => item.priority === 'high' && !item.isRead),
    normal: inboxItems.filter(item => item.priority === 'normal' && !item.isRead),
    suggestions: inboxItems.filter(item => item.type === 'suggestion' && !item.isRead),
  }
  
  const hasUnreadItems = unreadCount > 0
  
  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg relative hover:shadow-xl transition-shadow"
          onClick={() => setInboxOpen(true)}
          aria-label="打开收件箱"
        >
          <Inbox className="h-6 w-6" />
          
          {/* Unread Badge */}
          <AnimatePresence>
            {hasUnreadItems && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="destructive" className="h-6 min-w-6 rounded-full px-1.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
      
      {/* Drawer Panel */}
      <Sheet open={isInboxOpen} onOpenChange={setInboxOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                我的待办
                {hasUnreadItems && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </SheetTitle>
            </div>
          </SheetHeader>
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {!hasUnreadItems ? (
              <EmptyInbox />
            ) : (
              <div className="p-4 space-y-6">
                {/* Urgent Tasks */}
                {groupedItems.urgent.length > 0 && (
                  <InboxSection
                    title="🔴 紧急"
                    count={groupedItems.urgent.length}
                    items={groupedItems.urgent}
                  />
                )}
                
                {/* High Priority Tasks */}
                {groupedItems.high.length > 0 && (
                  <InboxSection
                    title="🟡 今日"
                    count={groupedItems.high.length}
                    items={groupedItems.high}
                  />
                )}
                
                {/* Normal Tasks */}
                {groupedItems.normal.length > 0 && (
                  <InboxSection
                    title="📋 待办"
                    count={groupedItems.normal.length}
                    items={groupedItems.normal}
                  />
                )}
                
                {/* AI Suggestions */}
                {groupedItems.suggestions.length > 0 && (
                  <InboxSection
                    title="💡 AI 建议"
                    count={groupedItems.suggestions.length}
                    items={groupedItems.suggestions}
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t p-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setInboxOpen(false)
                window.location.href = '/dashboard/tasks'
              }}
            >
              查看全部任务
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// Empty State Component
function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        太棒了！
      </h3>
      <p className="text-gray-600 mb-4">
        你已完成所有待办事项
      </p>
      <Button 
        variant="outline" 
        onClick={() => window.location.href = '/dashboard'}
      >
        返回工作台
      </Button>
    </div>
  )
}

// Section Component
interface InboxSectionProps {
  title: string
  count: number
  items: InboxItem[]
}

function InboxSection({ title, count, items }: InboxSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <TaskCard key={item.id} task={item} variant="compact" />
        ))}
      </div>
    </div>
  )
}

