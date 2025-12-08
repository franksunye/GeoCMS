'use client'

import { TopNavigation } from '@/components/workspace'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Main content */}
      <div className="flex flex-col flex-1 transition-all duration-200">
        {/* Header with Navigation */}
        <header className="sticky top-0 z-40 w-full border-b bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8 relative">
             {/* Logo */}
             <div className="flex items-center absolute left-8">
               <h1 className="text-xl font-bold text-primary">智能通话分析</h1>
             </div>
             
             {/* Navigation - Centered */}
             <div className="flex-1 flex justify-center">
               <TopNavigation />
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
    </div>
  )
}
