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
  Image,
  Settings,
  Calendar,
  BarChart3,
  MessageSquare,
  PhoneCall,
  Menu,
  X,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/stores/workspace-store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', href: '/dashboard/tasks', icon: Activity, badge: true },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  {
    name: 'Conversation',
    icon: MessageSquare,
    children: [
      { name: 'Overview', href: '/dashboard/conversation/overview', icon: LayoutDashboard },
      { name: 'Call List', href: '/dashboard/conversation/call-list', icon: PhoneCall },
      { name: 'Action Log', href: '/dashboard/conversation/action-log', icon: Activity },
      { name: 'Config', href: '/dashboard/conversation/config', icon: Settings },
    ]
  },
  {
    name: 'Team Calls',
    icon: PhoneCall,
    children: [
      { name: 'Overview', href: '/dashboard/team-calls/overview', icon: LayoutDashboard },
      { name: 'Call List', href: '/dashboard/team-calls/call-list', icon: PhoneCall },
      { name: 'Scorecard', href: '/dashboard/team-calls/scorecard', icon: BarChart3 },
      { name: 'Action Log', href: '/dashboard/team-calls/action-log', icon: Activity },
      { name: 'Config', href: '/dashboard/team-calls/config', icon: Settings },
    ]
  },
  { name: 'Knowledge', href: '/dashboard/knowledge', icon: BookOpen },
  {
    name: 'Content',
    icon: BookOpen,
    children: [
      { name: 'Planning', href: '/dashboard/planning', icon: FileText },
      { name: 'Drafts', href: '/dashboard/drafts', icon: PenTool },
      { name: 'Media', href: '/dashboard/media', icon: Image },
    ]
  },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface CollapsibleSidebarProps {
  activeBadgeCount?: number
}

export function CollapsibleSidebar({ activeBadgeCount = 0 }: CollapsibleSidebarProps) {
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useWorkspaceStore()

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "hidden md:fixed md:inset-y-0 md:flex md:flex-col bg-white border-r border-gray-200 z-30 transition-transform duration-200 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: '260px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-2xl font-bold text-primary">
            GeoCMS
          </h1>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (item.children) {
              return (
                <NavGroup
                  key={item.name}
                  item={item}
                  pathname={pathname}
                />
              )
            }

            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
            const showBadge = item.badge && activeBadgeCount > 0

            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                showBadge={showBadge}
                badgeCount={activeBadgeCount}
              />
            )
          })}
        </nav>
      </div>

      {/* Toggle button when sidebar is closed - ChatGPT style */}
      {!isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex fixed top-4 left-4 z-40 h-10 w-10"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}

// Nav Item Component
interface NavItemProps {
  item: any
  isActive: boolean
  showBadge?: boolean
  badgeCount?: number
}

function NavItem({ item, isActive, showBadge, badgeCount }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-primary text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <item.icon
        className={cn(
          'h-5 w-5 mr-3',
          isActive ? 'text-white' : 'text-gray-500'
        )}
      />
      <span className="flex-1">{item.name}</span>
      {showBadge && (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {badgeCount}
        </span>
      )}
    </Link>
  )
}

// Nav Group Component
interface NavGroupProps {
  item: any
  pathname: string
}

function NavGroup({ item, pathname }: NavGroupProps) {
  const isAnyChildActive = item.children.some((child: any) =>
    pathname === child.href || pathname.startsWith(`${child.href}/`)
  )

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
