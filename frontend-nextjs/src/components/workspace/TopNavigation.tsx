'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  name: string
  href?: string
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  { name: '评分看板', href: '/dashboard/team-calls/scorecard' },
  { name: '通话列表', href: '/dashboard/team-calls/call-list' },
  {
    name: '数据罗盘',
    children: [
      { name: '数据源概览', href: '/dashboard/team-calls/data-sources' },
      { name: '分数明细', href: '/dashboard/team-calls/score-details' },
      { name: '通话时长分析', href: '/dashboard/team-calls/duration-analysis' },
      { name: '效果验证', href: '/dashboard/team-calls/score-validation' },
    ]
  },
  {
    name: '智能配置',
    children: [
      { name: '配置中心', href: '/dashboard/team-calls/config' },
      { name: 'AI提示词', href: '/dashboard/team-calls/prompts' },
      { name: 'AI审计', href: '/dashboard/team-calls/ai-audit' },
    ]
  },
  {
    name: '系统管理',
    children: [
      { name: '团队管理', href: '/dashboard/team' },
      { name: '系统设置', href: '/dashboard/settings' },
    ]
  },
]

export function TopNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-center w-full">
      <div className="flex items-center space-x-2 md:space-x-6 px-4">
        {navigation.map((item) => {
          // Check if it's a direct link or a group
          if (item.href && !item.children) {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-base font-medium transition-colors hover:text-primary px-3 py-2 rounded-md block",
                  isActive 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            )
          }

          // It's a group (Dropdown)
          if (item.children) {
            const isChildActive = item.children.some(child => 
              pathname === child.href || pathname.startsWith(`${child.href}/`)
            )

            return (
              <DropdownMenu key={item.name}>
                <DropdownMenuTrigger className={cn(
                  "flex items-center gap-1 text-base font-medium transition-colors hover:text-primary px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-primary/20",
                   isChildActive ? "text-primary bg-primary/5" : "text-muted-foreground"
                )}>
                  {item.name}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`)
                     return (
                      <DropdownMenuItem key={child.name} asChild>
                        <Link 
                          href={child.href}
                          className={cn(
                            "w-full cursor-pointer",
                            isChildActive && "font-medium text-primary bg-primary/5"
                          )}
                        >
                          {child.name}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
           return null
        })}
      </div>
    </nav>
  )
}
