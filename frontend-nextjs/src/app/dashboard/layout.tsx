'use client'

import { TopNavigation } from '@/components/workspace'
import { UserNav } from '@/components/workspace/UserNav' // Import UserNav

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center px-4 sm:px-6 md:px-8">
            {/* Left: Logo */}
            <div className="flex-shrink-0 mr-4 md:mr-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 hidden md:block">智能通话分析</h1>
            </div>
            
            {/* Center: Navigation */}
            <div className="flex-1 flex justify-center">
              <TopNavigation />
            </div>

             {/* Right: User UserNav & Actions */}
             <div className="flex-shrink-0 ml-4 md:ml-8 flex items-center gap-4">
               {/* Add more icons/buttons here like Notifications later */}
               <UserNav />
             </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
