'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  PhoneCall,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react'

const navigation = [
  { name: 'Scorecard', href: '/dashboard/team-calls/scorecard', icon: BarChart3 },
  { name: 'Call List', href: '/dashboard/team-calls/call-list', icon: PhoneCall },
  { name: 'Analytics', href: '/dashboard/team-calls/analytics', icon: BarChart3 },
  { name: 'Config', href: '/dashboard/team-calls/config', icon: Settings },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function TopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
