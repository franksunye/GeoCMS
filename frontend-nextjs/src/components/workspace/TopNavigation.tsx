'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '评分看板', href: '/dashboard/team-calls/scorecard' },
  { name: '通话列表', href: '/dashboard/team-calls/call-list' },
  { name: '分析报表', href: '/dashboard/team-calls/analytics' },
  { name: '配置中心', href: '/dashboard/team-calls/config' },
  { name: '团队管理', href: '/dashboard/team' },
  { name: '系统设置', href: '/dashboard/settings' },
]

export function TopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-center w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-6 md:space-x-10 px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-base font-medium transition-all duration-200 whitespace-nowrap py-4 border-b-2",
                isActive 
                  ? "text-primary border-primary" 
                  : "text-gray-500 border-transparent hover:text-primary hover:border-gray-200"
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
