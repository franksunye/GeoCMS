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
    { label: 'What are my current tasks?', query: 'List my pending tasks' },
    { label: 'What should I do first?', query: 'Recommend my next task based on priority' },
    { label: 'Help me create a content plan', query: 'I want to create a new content plan' },
    { label: 'View team status', query: 'Show current AI team work status' },
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
    if (query.toLowerCase().includes('task')) {
      return 'You currently have 4 pending tasks:\n\n1. 🔴 Urgent: Draft Approval - Spring Travel Guide\n2. 🔴 Urgent: Draft Approval - Product Features\n3. 🟡 Today: Plan Feedback - Q1 Content Planning\n4. 🟡 Today: Delayed Task Alert\n\nI recommend prioritizing urgent tasks first.'
    }

    if (query.toLowerCase().includes('recommend') || query.toLowerCase().includes('first')) {
      return 'Based on priority and deadline, I recommend handling this first:\n\n📝 Draft Approval: Spring Travel Guide\n- Priority: Urgent\n- Deadline: Today 6:00 PM\n- Quality Score: 8.5/10\n\nThis draft has high quality and should be quickly approved for publishing.'
    }

    if (query.toLowerCase().includes('content plan') || query.toLowerCase().includes('create')) {
      return 'I can help you create a content plan. Please tell me:\n\n1. What is the content topic?\n2. Who is the target audience?\n3. What outcome do you expect?\n\nOr you can click the button below to create quickly.'
    }

    if (query.toLowerCase().includes('team') || query.toLowerCase().includes('status')) {
      return 'Current AI Team Status:\n\n👤 Alex (Knowledge Manager) - 🟢 Active\nWorking on: Brand Guidelines Update\n\n👤 Sarah (Content Planner) - 🟡 Idle\nLast task: 2 minutes ago\n\n👤 Emma (Content Writer) - 🟢 Active\nWriting: Spring Travel Guide\n\n👤 Michael (Quality Reviewer) - 🟡 Idle\nCompleted today: 3 reviews'
    }

    return 'I understand your question. As GeoCMS AI Assistant, I can help you:\n\n• Manage pending tasks\n• Create content plans\n• View team status\n• Analyze content quality\n• Provide optimization suggestions\n\nWhat do you need help with?'
  }
  
  const getQuickActions = (query: string) => {
    if (query.toLowerCase().includes('task')) {
      return [
        {
          label: 'View All Tasks',
          onClick: () => {
            setAssistantOpen(false)
            window.location.href = '/dashboard/tasks'
          }
        }
      ]
    }

    if (query.toLowerCase().includes('content plan')) {
      return [
        {
          label: 'Create Content Plan',
          onClick: () => {
            setAssistantOpen(false)
            window.location.href = '/dashboard/planning'
          }
        }
      ]
    }

    if (query.toLowerCase().includes('team')) {
      return [
        {
          label: 'View Team Details',
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
          aria-label="Open AI Assistant"
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
              <h2 className="text-lg font-semibold">AI Assistant</h2>
            </div>
            <p className="text-sm text-white/80 mt-1">
              How can I help you?
            </p>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  Hello! I&apos;m GeoCMS AI Assistant. Try these quick questions:
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
                placeholder="Type your question..."
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
            addSuffix: true
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

