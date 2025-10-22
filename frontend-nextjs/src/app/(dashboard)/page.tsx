'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Stats } from '@/types'
import { BookOpen, FileText, PenTool, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const statCards = [
    {
      name: '知识库',
      value: stats?.totalKnowledge || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/dashboard/knowledge',
    },
    {
      name: '策划中',
      value: stats?.totalPlans || 0,
      icon: FileText,
      color: 'bg-purple-500',
      href: '/dashboard/planning',
    },
    {
      name: '草稿',
      value: stats?.totalDrafts || 0,
      icon: PenTool,
      color: 'bg-orange-500',
      href: '/dashboard/drafts',
    },
    {
      name: '已发布',
      value: stats?.publishedContent || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/dashboard/drafts?status=已发布',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">概览</h1>
        <p className="mt-2 text-gray-600">欢迎使用 GeoCMS 内容管理系统</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速开始</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/knowledge"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <BookOpen className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">管理知识库</h3>
              <p className="text-sm text-gray-500">添加和管理品牌知识</p>
            </div>
          </Link>
          <Link
            href="/dashboard/planning"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-primary mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">创建内容计划</h3>
              <p className="text-sm text-gray-500">规划新的内容策略</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Status Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              策划状态分布
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.plansByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count} 个
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              草稿状态分布
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.draftsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count} 个
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

