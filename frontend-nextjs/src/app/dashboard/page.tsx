'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Stats } from '@/types'
import Link from 'next/link'
import ActiveTasksSummary from '@/components/agent/ActiveTasksSummary'
import TeamStatusBar from '@/components/team/TeamStatusBar'
import ActivityTimeline from '@/components/team/ActivityTimeline'
import { Database, FileText, PenLine, CheckCircle2 } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await axios.get('/api/stats')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Knowledge Base',
      value: stats?.totalKnowledge || 0,
      icon: Database,
      color: 'bg-blue-500',
      href: '/dashboard/knowledge',
    },
    {
      name: 'In Planning',
      value: stats?.totalPlans || 0,
      icon: FileText,
      color: 'bg-purple-500',
      href: '/dashboard/planning',
    },
    {
      name: 'Drafts',
      value: stats?.totalDrafts || 0,
      icon: PenLine,
      color: 'bg-orange-500',
      href: '/dashboard/drafts',
    },
    {
      name: 'Published',
      value: stats?.publishedContent || 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      href: '/dashboard/drafts?status=published',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="mt-2 text-gray-600">Welcome to GeoCMS Content Management System</p>
      </div>

      {/* Team Status Bar */}
      <TeamStatusBar />

      {/* Agent Workspace Summary */}
      <div className="mb-8">
        <ActiveTasksSummary />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/knowledge"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <div className="flex-shrink-0 rounded-md p-3 bg-blue-500 mr-3">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Knowledge Base</h3>
              <p className="text-sm text-gray-500">Add and manage brand knowledge</p>
            </div>
          </Link>
          <Link
            href="/dashboard/planning"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <div className="flex-shrink-0 rounded-md p-3 bg-purple-500 mr-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create Content Plan</h3>
              <p className="text-sm text-gray-500">Plan new content strategy</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Status Overview and Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        {stats && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Planning Status Distribution
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.plansByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{status}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Draft Status Distribution
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.draftsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{status}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link
            href="/dashboard/activity"
            className="text-sm text-primary hover:text-primary/80"
          >
            View All
          </Link>
        </div>
        <ActivityTimeline limit={5} />
      </div>
    </div>
  )
}

