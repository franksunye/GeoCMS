'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useWorkspaceStore } from '@/lib/stores/workspace-store'
import { ChatMessage } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function AIAssistant() {
  const { isAssistantOpen, setAssistantOpen } = useWorkspaceStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Quick questions
  const quickQuestions = [
    { label: '我现在有什么任务？', query: '列出我的待办任务' },
    { label: '我该先做哪个？', query: '根据优先级推荐我下一步做什么' },
    { label: '帮我创建内容计划', query: '我想创建一个新的内容计划' },
    { label: '查看团队状态', query: '显示 AI 团队当前的工作状态' },
  ]
  
  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    // Simulate AI response (in production, this would call the AI API)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(text),
        timestamp: new Date(),
        actions: getQuickActions(text),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }
  
  // Simulated responses for demo
  const getSimulatedResponse = (query: string): string => {
    if (query.includes('任务')) {
      return '你当前有 4 个待办任务：\n\n1. 🔴 紧急：草稿审批 - 春季旅游攻略\n2. 🔴 紧急：草稿审批 - 产品功能介绍\n3. 🟡 今日：计划反馈 - Q1 内容规划\n4. 🟡 今日：延迟任务提醒\n\n建议优先处理紧急任务。'
    }
    
    if (query.includes('推荐') || query.includes('先做')) {
      return '根据优先级和截止时间，建议你先处理：\n\n📝 草稿审批：春季旅游攻略\n- 优先级：紧急\n- 截止时间：今天 18:00\n- 质量分：8.5/10\n\n这篇草稿质量较高，建议快速审批后发布。'
    }
    
    if (query.includes('内容计划') || query.includes('创建')) {
      return '好的，我可以帮你创建内容计划。请告诉我：\n\n1. 内容主题是什么？\n2. 目标受众是谁？\n3. 期望达到什么效果？\n\n或者你可以直接点击下方按钮快速创建。'
    }
    
    if (query.includes('团队') || query.includes('状态')) {
      return '当前 AI 团队状态：\n\n👤 Alex (知识管理员) - 🟢 活跃\n正在处理：品牌指南更新\n\n👤 Sarah (内容策划) - 🟡 空闲\n上次任务：2分钟前\n\n👤 Emma (内容撰写) - 🟢 活跃\n正在写作：春季旅游攻略\n\n👤 Michael (质量审核) - 🟡 空闲\n今日完成：3 个审核'
    }
    
    return '我理解了你的问题。作为 GeoCMS AI 助手，我可以帮你：\n\n• 管理待办任务\n• 创建内容计划\n• 查看团队状态\n• 分析内容质量\n• 提供优化建议\n\n请告诉我你需要什么帮助？'
  }
  
  const getQuickActions = (query: string) => {
    if (query.includes('任务')) {
      return [
        {
          label: '查看全部任务',
          onClick: () => {
            setAssistantOpen(false)
            window.location.href = '/dashboard/tasks'
          }
        }
      ]
    }
    
    if (query.includes('内容计划')) {
      return [
        {
          label: '创建内容计划',
          onClick: () => {
            setAssistantOpen(false)
            window.location.href = '/dashboard/planning'
          }
        }
      ]
    }
    
    if (query.includes('团队')) {
      return [
        {
          label: '查看团队详情',
          onClick: () => {
            setAssistantOpen(false)
            window.location.href = '/dashboard/team'
          }
        }
      ]
    }
    
    return undefined
  }
  
  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 relative overflow-hidden"
          onClick={() => setAssistantOpen(true)}
          aria-label="打开 AI 助手"
        >
          {/* Breathing animation */}
          <motion.div
            className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Bot className="h-6 w-6 relative z-10" />
        </Button>
      </motion.div>
      
      {/* Chat Dialog */}
      <Dialog open={isAssistantOpen} onOpenChange={setAssistantOpen}>
        <DialogContent className="sm:max-w-[400px] h-[600px] p-0 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h2 className="text-lg font-semibold">AI 助手</h2>
            </div>
            <p className="text-sm text-white/80 mt-1">
              我能帮你什么？
            </p>
          </div>
          
          {/* Messages Area */}
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
          
          {/* Input Area */}
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

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
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
        
        {/* Quick Action Buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full bg-white hover:bg-gray-50"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        <p className="text-xs opacity-70 mt-1">
          {formatDistanceToNow(message.timestamp, {
            addSuffix: true,
            locale: zhCN,
          })}
        </p>
      </div>
    </div>
  )
}

// Typing Indicator
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

