# AI Native Workspace - 组件详细规范

> **配套文档**: AI_NATIVE_WORKSPACE_UPGRADE.md  
> **版本**: v1.0  
> **日期**: 2025-10-24

本文档提供具体的组件实现规范，包括视觉设计、交互细节和代码示例。

---

## 📋 目录

1. [KPIDashboard 组件](#kpidashboard-组件)
2. [FloatingInbox 组件](#floatinginbox-组件)
3. [AIAssistant 组件](#aiassistant-组件)
4. [ActionItemsPanel 组件](#actionitemspanel-组件)
5. [CollapsibleSidebar 组件](#collapsiblesidebar-组件)
6. [EnhancedAgentStatusBar 组件](#enhancedagentstatusbar-组件)

---

## 📊 KPIDashboard 组件

### 用途
首页顶部的核心 KPI 仪表盘，展示内容营销的关键指标，帮助用户快速了解整体表现。

### 视觉设计

#### 紧凑模式（默认，首页顶部）
```
位置: 首页顶部，固定（sticky）
高度: 80px
布局: 5-6 个指标卡片横向排列
背景: 白色，带轻微阴影
```

#### 展开模式（点击后）
```
位置: 全屏对话框或侧边抽屉
内容: 详细图表、趋势分析、数据对比
```

### 组件结构

```typescript
// components/workspace/KPIDashboard.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface KPIMetric {
  id: string
  label: string
  value: number | string
  unit?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    isGood: boolean  // 上升是好事还是坏事
  }
  target?: number
  status?: 'success' | 'warning' | 'danger'
}

export function KPIDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['kpi-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/kpi')
      return res.json()
    },
    refetchInterval: 60000, // 每分钟刷新
  })

  const metrics: KPIMetric[] = data?.metrics || []

  return (
    <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">核心指标</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/dashboard/analytics'}
          >
            查看详细报告
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <KPISkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <KPICard metric={metric} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// KPI 卡片组件
function KPICard({ metric }: { metric: KPIMetric }) {
  const getTrendIcon = () => {
    switch (metric.trend?.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    if (!metric.trend) return 'text-gray-500'

    const { direction, isGood } = metric.trend

    if (direction === 'stable') return 'text-gray-500'
    if (direction === 'up' && isGood) return 'text-green-600'
    if (direction === 'up' && !isGood) return 'text-red-600'
    if (direction === 'down' && isGood) return 'text-green-600'
    if (direction === 'down' && !isGood) return 'text-red-600'

    return 'text-gray-500'
  }

  const getStatusColor = () => {
    switch (metric.status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'danger':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  return (
    <Card className={`p-3 ${getStatusColor()} transition-all hover:shadow-md cursor-pointer`}>
      <div className="space-y-1">
        <p className="text-xs text-gray-600 font-medium">{metric.label}</p>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="text-sm text-gray-500">{metric.unit}</span>
          )}
        </div>

        {metric.trend && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-medium">
              {metric.trend.percentage > 0 ? '+' : ''}
              {metric.trend.percentage}%
            </span>
          </div>
        )}

        {metric.target && (
          <div className="text-xs text-gray-500">
            目标: {metric.target}
          </div>
        )}
      </div>
    </Card>
  )
}

// 骨架屏
function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="p-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-12" />
        </Card>
      ))}
    </div>
  )
}
```

### 数据结构示例

```typescript
// API Response: /api/workspace/kpi
{
  metrics: [
    {
      id: 'weekly_published',
      label: '本周发布',
      value: 12,
      unit: '篇',
      trend: {
        direction: 'up',
        percentage: 20,
        isGood: true
      },
      target: 15,
      status: 'warning'  // 接近目标但未达成
    },
    {
      id: 'pending_publish',
      label: '待发布',
      value: 8,
      unit: '篇',
      status: 'success'
    },
    {
      id: 'avg_cycle',
      label: '平均周期',
      value: '2.3',
      unit: '天',
      trend: {
        direction: 'down',
        percentage: 15,
        isGood: true  // 周期缩短是好事
      },
      status: 'success'
    },
    {
      id: 'quality_score',
      label: '质量分',
      value: '8.5',
      unit: '/10',
      trend: {
        direction: 'up',
        percentage: 6,
        isGood: true
      },
      status: 'success'
    },
    {
      id: 'ai_efficiency',
      label: 'AI 效率',
      value: '75',
      unit: '%',
      trend: {
        direction: 'up',
        percentage: 5,
        isGood: true
      },
      status: 'success'
    }
  ]
}
```

### 交互细节

1. **固定顶部**: 使用 `sticky` 定位，滚动时始终可见
2. **点击卡片**: 跳转到对应的详细分析页面
3. **颜色编码**:
   - 绿色边框：达标或超额完成
   - 黄色边框：接近目标，需要关注
   - 红色边框：未达标，需要行动
4. **趋势动画**: 数字变化时有平滑过渡动画
5. **响应式**: 移动端显示 2 列，平板 3 列，桌面 5 列

---

## 🎯 FloatingInbox 组件

### 视觉设计

#### 收起状态
```
位置: 右下角，距离底部 24px，距离右侧 24px
尺寸: 56px × 56px (圆形按钮)
颜色: 主题色 (Primary)
阴影: shadow-lg
徽章: 右上角，红色背景，白色文字
```

#### 展开状态
```
位置: 从右侧滑入
尺寸: 宽度 400px (桌面) / 100vw (移动)
      高度 60vh (最大)
背景: 白色
阴影: shadow-2xl
圆角: rounded-lg (左上和左下)
```

### 组件结构

```typescript
// components/workspace/FloatingInbox.tsx
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Inbox, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { InboxItem } from '@/types/workspace'
import { TaskCard } from './TaskCard'
import { motion, AnimatePresence } from 'framer-motion'

export function FloatingInbox() {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data, isLoading } = useQuery({
    queryKey: ['workspace-inbox'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/inbox')
      return res.json()
    },
    refetchInterval: 5000,
  })
  
  const unreadCount = data?.unread_count || 0
  const items = data?.items || []
  
  // 按优先级分组
  const groupedItems = {
    urgent: items.filter((item: InboxItem) => item.priority === 'urgent'),
    high: items.filter((item: InboxItem) => item.priority === 'high'),
    normal: items.filter((item: InboxItem) => item.priority === 'normal'),
    suggestions: items.filter((item: InboxItem) => item.type === 'suggestion'),
  }
  
  return (
    <>
      {/* 浮动按钮 */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg relative"
          onClick={() => setIsOpen(true)}
        >
          <Inbox className="h-6 w-6" />
          
          {/* 未读徽章 */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="destructive" className="h-6 min-w-6 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
      
      {/* 抽屉面板 */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          {/* 头部 */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                我的待办
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </SheetTitle>
            </div>
          </SheetHeader>
          
          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                加载中...
              </div>
            ) : items.length === 0 ? (
              <EmptyInbox />
            ) : (
              <div className="p-4 space-y-6">
                {/* 紧急任务 */}
                {groupedItems.urgent.length > 0 && (
                  <InboxSection
                    title="🔴 紧急"
                    count={groupedItems.urgent.length}
                    items={groupedItems.urgent}
                  />
                )}
                
                {/* 高优先级任务 */}
                {groupedItems.high.length > 0 && (
                  <InboxSection
                    title="🟡 今日"
                    count={groupedItems.high.length}
                    items={groupedItems.high}
                  />
                )}
                
                {/* 普通任务 */}
                {groupedItems.normal.length > 0 && (
                  <InboxSection
                    title="📋 待办"
                    count={groupedItems.normal.length}
                    items={groupedItems.normal}
                  />
                )}
                
                {/* AI 建议 */}
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
          
          {/* 底部操作 */}
          <div className="border-t p-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setIsOpen(false)
                // 跳转到任务页面
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

// 空状态组件
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
      <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
        返回工作台
      </Button>
    </div>
  )
}

// 分组区域组件
function InboxSection({ 
  title, 
  count, 
  items 
}: { 
  title: string
  count: number
  items: InboxItem[] 
}) {
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
```

### 交互细节

1. **打开动画**: 按钮从右下角弹出，使用弹簧动画
2. **徽章动画**: 未读数变化时，徽章缩放动画
3. **滑入动画**: 面板从右侧滑入，300ms 缓动
4. **滚动行为**: 内容区域独立滚动，头部和底部固定
5. **关闭方式**: 
   - 点击遮罩层
   - 点击关闭按钮
   - 按 ESC 键
   - 完成所有任务后自动关闭（可选）

---

## 🤖 AIAssistant 组件

### 视觉设计

#### 收起状态
```
位置: 右下角，浮动 Inbox 上方 80px
尺寸: 56px × 56px (圆形按钮)
颜色: 渐变色 (紫色到蓝色)
图标: 机器人或闪电图标
动画: 轻微呼吸效果
```

#### 展开状态
```
位置: 从右下角展开
尺寸: 宽度 400px (桌面) / 100vw (移动)
      高度 600px (桌面) / 80vh (移动)
布局: 聊天界面
```

### 组件结构

```typescript
// components/workspace/AIAssistant.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: QuickAction[]
}

interface QuickAction {
  label: string
  onClick: () => void
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 发送消息
  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ai-native/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            page: pathname,
          },
        }),
      })
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actions: data.actions,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // 快捷问题
  const quickQuestions = [
    { label: '我现在有什么任务？', query: '列出我的待办任务' },
    { label: '我该先做哪个？', query: '根据优先级推荐我下一步做什么' },
    { label: '帮我创建内容计划', query: '我想创建一个新的内容计划' },
    { label: '查看团队状态', query: '显示 AI 团队当前的工作状态' },
  ]
  
  return (
    <>
      {/* 浮动按钮 */}
      <motion.div
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 relative overflow-hidden"
          onClick={() => setIsOpen(true)}
        >
          {/* 呼吸动画 */}
          <motion.div
            className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Bot className="h-6 w-6 relative z-10" />
        </Button>
      </motion.div>
      
      {/* 聊天对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] h-[600px] p-0 flex flex-col">
          {/* 头部 */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h2 className="text-lg font-semibold">AI 助手</h2>
            </div>
            <p className="text-sm text-white/80 mt-1">
              我能帮你什么？
            </p>
          </div>
          
          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  你好！我是 GeoCMS AI 助手。试试这些快捷问题：
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickQuestions.map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => sendMessage(q.query)}
                    >
                      <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{q.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* 输入区域 */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage(input)
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// 消息气泡组件
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {/* 快捷操作按钮 */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

// 输入中指示器
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 ActionItemsPanel 组件

### 用途
首页顶部的"我的待办任务"面板，展示用户需要立即处理的事项。

### 组件结构

```typescript
// components/workspace/ActionItemsPanel.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { TaskCard } from './TaskCard'

export function ActionItemsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['action-items'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/dashboard')
      return res.json()
    },
  })
  
  const actionItems = data?.action_items || []
  const urgentCount = actionItems.filter((item: any) => item.priority === 'urgent').length
  
  if (isLoading) {
    return <ActionItemsSkeleton />
  }
  
  if (actionItems.length === 0) {
    return <NoActionItems />
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">我的待办任务</h2>
          <p className="text-sm text-gray-600 mt-1">
            你有 {actionItems.length} 个待处理事项
            {urgentCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {urgentCount} 个紧急
              </Badge>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/tasks'}>
          查看全部
        </Button>
      </div>
      
      <div className="space-y-3">
        {actionItems.slice(0, 5).map((item: any) => (
          <TaskCard key={item.id} task={item} variant="detailed" />
        ))}
      </div>
      
      {actionItems.length > 5 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => window.location.href = '/dashboard/tasks'}>
            还有 {actionItems.length - 5} 个任务...
          </Button>
        </div>
      )}
    </Card>
  )
}
```

---

## 🎨 视觉设计系统

### 颜色定义

```css
/* tailwind.config.ts */
module.exports = {
  theme: {
    extend: {
      colors: {
        // 优先级颜色
        priority: {
          urgent: '#EF4444',
          high: '#F59E0B',
          normal: '#3B82F6',
          low: '#6B7280',
        },
        // Agent 状态颜色
        agent: {
          active: '#10B981',
          idle: '#F59E0B',
          offline: '#6B7280',
        },
      },
    },
  },
}
```

### 间距系统

```
xs: 4px   (0.5rem)
sm: 8px   (1rem)
md: 16px  (2rem)
lg: 24px  (3rem)
xl: 32px  (4rem)
```

### 字体大小

```
xs: 12px
sm: 14px
base: 16px
lg: 18px
xl: 20px
2xl: 24px
3xl: 30px
```

---

**文档版本**: v1.0  
**最后更新**: 2025-10-24  
**维护者**: GeoCMS UX Team

