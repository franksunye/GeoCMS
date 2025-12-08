'use client'

import UnifiedSearch from '@/components/UnifiedSearch'
import { TopNavigation, FloatingInbox, AIAssistant } from '@/components/workspace'
import { useWorkspaceStore } from '@/lib/stores/workspace-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isInboxPinned } = useWorkspaceStore()

  // Calculate padding based on inbox state - ChatGPT style
  const inboxWidth = isInboxPinned ? 400 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Main content */}
      <div
        className="flex flex-col flex-1 transition-all duration-200"
        style={{
          paddingRight: `${inboxWidth}px`
        }}
      >
        {/* Header with Navigation and Search */}
        <header className="sticky top-0 z-40 w-full border-b bg-white">
          <div className="flex h-16 items-center px-4 sm:px-6 md:px-8">
             {/* Logo */}
             <div className="flex items-center mr-8">
               <h1 className="text-xl font-bold text-primary">GeoCMS</h1>
             </div>
             
             {/* Navigation */}
             <TopNavigation />
             
             {/* Spacer */}
             <div className="flex-1" />
             
             {/* Search */}
             <div className="w-64">
               <UnifiedSearch />
             </div>
          </div>
        </header>

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
