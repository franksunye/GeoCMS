'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Menu } from 'lucide-react'
import { AgentRunList } from '@/types'
import UnifiedSearch from '@/components/UnifiedSearch'
import { CollapsibleSidebar, FloatingInbox, AIAssistant } from '@/components/workspace'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 获取活跃任务数量
  const { data: agentData } = useQuery<AgentRunList>({
    queryKey: ['agent-runs', 'active'],
    queryFn: async () => {
      const response = await axios.get('/api/agent/runs?status=active&limit=5')
      return response.data
    },
    refetchInterval: 5000, // 每5秒刷新
  })

  const activeBadgeCount = agentData?.active_count || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Collapsible Sidebar for desktop */}
      <CollapsibleSidebar activeBadgeCount={activeBadgeCount} />

      {/* Main content */}
      <div className="md:pl-16 flex flex-col flex-1 transition-all duration-200">
        {/* Header with search */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 md:px-8">
            {/* Mobile menu button */}
            <button
              className="md:hidden -ml-0.5 h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>

            {/* Search bar */}
            <div className="flex-1 max-w-md mx-4">
              <UnifiedSearch />
            </div>

            {/* Spacer */}
            <div className="flex-1" />
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Components */}
      <FloatingInbox />
      <AIAssistant />
    </div>
  )
}

