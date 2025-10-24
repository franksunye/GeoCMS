'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  PenTool,
  Activity,
  Users,
  Clock,
  Image,
  Send,
  Layout as LayoutIcon,
  Tag,
  Settings,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '@/lib/stores/workspace-store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navigation = [
  { name: '工作台', href: '/dashboard', icon: LayoutDashboard },
  { name: '我的任务', href: '/dashboard/tasks', icon: Activity, badge: true },
  { name: '团队', href: '/dashboard/team', icon: Users },
  { 
    name: '内容库', 
    icon: BookOpen,
    children: [
      { name: '知识', href: '/dashboard/knowledge', icon: BookOpen },
      { name: '计划', href: '/dashboard/planning', icon: FileText },
      { name: '草稿', href: '/dashboard/drafts', icon: PenTool },
      { name: '媒体', href: '/dashboard/media', icon: Image },
    ]
  },
  { name: '数据洞察', href: '/dashboard/analytics', icon: BarChart3 },
  { name: '日历', href: '/dashboard/calendar', icon: Calendar },
  { name: '设置', href: '/dashboard/settings', icon: Settings },
]

interface CollapsibleSidebarProps {
  activeBadgeCount?: number
}

export function CollapsibleSidebar({ activeBadgeCount = 0 }: CollapsibleSidebarProps) {
  const pathname = usePathname()
  const { isSidebarCollapsed, isSidebarPinned, setSidebarCollapsed, toggleSidebarPin } = useWorkspaceStore()
  
  const isCollapsed = isSidebarCollapsed && !isSidebarPinned
  
  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        className="hidden md:fixed md:inset-y-0 md:flex md:flex-col bg-white border-r border-gray-200 z-30"
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        onMouseEnter={() => !isSidebarPinned && setSidebarCollapsed(false)}
        onMouseLeave={() => !isSidebarPinned && setSidebarCollapsed(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-bold text-primary"
              >
                GeoCMS
              </motion.h1>
            )}
          </AnimatePresence>
          
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebarPin}
              aria-label={isSidebarPinned ? '取消固定' : '固定侧边栏'}
            >
              {isSidebarPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (item.children) {
              return (
                <NavGroup
                  key={item.name}
                  item={item}
                  isCollapsed={isCollapsed}
                  pathname={pathname}
                />
              )
            }
            
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const showBadge = item.badge && activeBadgeCount > 0
            
            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
                showBadge={showBadge}
                badgeCount={activeBadgeCount}
              />
            )
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            className={cn('w-full', isCollapsed ? 'h-10' : 'justify-start')}
            onClick={() => setSidebarCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                收起
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}

// Nav Item Component
interface NavItemProps {
  item: any
  isActive: boolean
  isCollapsed: boolean
  showBadge?: boolean
  badgeCount?: number
}

function NavItem({ item, isActive, isCollapsed, showBadge, badgeCount }: NavItemProps) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-700 hover:bg-gray-100',
        isCollapsed && 'justify-center'
      )}
    >
      <item.icon
        className={cn(
          'h-5 w-5',
          isActive ? 'text-white' : 'text-gray-500',
          !isCollapsed && 'mr-3'
        )}
      />
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1"
          >
            {item.name}
          </motion.span>
        )}
      </AnimatePresence>
      {showBadge && !isCollapsed && (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {badgeCount}
        </span>
      )}
    </Link>
  )
  
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.name}</p>
        </TooltipContent>
      </Tooltip>
    )
  }
  
  return content
}

// Nav Group Component
interface NavGroupProps {
  item: any
  isCollapsed: boolean
  pathname: string
}

function NavGroup({ item, isCollapsed, pathname }: NavGroupProps) {
  const isAnyChildActive = item.children.some((child: any) => 
    pathname === child.href || pathname.startsWith(child.href)
  )
  
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer flex justify-center">
            <item.icon className="h-5 w-5 text-gray-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            <p className="font-semibold">{item.name}</p>
            {item.children.map((child: any) => (
              <Link
                key={child.name}
                href={child.href}
                className="block px-2 py-1 text-sm hover:bg-gray-100 rounded"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }
  
  return (
    <div className="space-y-1">
      <div className={cn(
        'px-3 py-2 text-sm font-medium text-gray-700 flex items-center',
        isAnyChildActive && 'text-primary'
      )}>
        <item.icon className={cn(
          'h-5 w-5 mr-3',
          isAnyChildActive ? 'text-primary' : 'text-gray-500'
        )} />
        {item.name}
      </div>
      <div className="ml-8 space-y-1">
        {item.children.map((child: any) => {
          const isActive = pathname === child.href || pathname.startsWith(child.href)
          return (
            <Link
              key={child.name}
              href={child.href}
              className={cn(
                'block px-3 py-1.5 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {child.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

