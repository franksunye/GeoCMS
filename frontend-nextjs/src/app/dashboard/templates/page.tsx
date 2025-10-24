'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Trash2, Edit2, Copy, Eye } from 'lucide-react'
import { Template } from '@/types'

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: templatesList = [], isLoading } = useQuery({
    queryKey: ['templates', searchTerm, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterCategory) params.append('category', filterCategory)

      const res = await fetch(`/api/templates?${params}`)
      const json = await res.json()
      return json.data || []
    },
  })

  const { data: selectedTemplate } = useQuery({
    queryKey: ['templates', selectedId],
    queryFn: async () => {
      if (!selectedId) return null
      const res = await fetch(`/api/templates/${selectedId}`)
      const json = await res.json()
      return json.data
    },
    enabled: !!selectedId,
  })

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个模板吗？')) {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      blog: '📝 博客',
      website: '🌐 网站',
      product: '📦 产品',
      faq: '❓ FAQ',
      custom: '⚙️ 自定义',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'blog':
        return 'bg-blue-100 text-blue-800'
      case 'website':
        return 'bg-purple-100 text-purple-800'
      case 'product':
        return 'bg-green-100 text-green-800'
      case 'faq':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">模板管理</h1>
          <p className="text-gray-600 mt-1">创建和管理内容模板</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} />
          新建模板
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有分类</option>
          <option value="blog">博客</option>
          <option value="website">网站</option>
          <option value="product">产品</option>
          <option value="faq">FAQ</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : templatesList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无模板</div>
            ) : (
              <div className="divide-y">
                {templatesList.map((template: Template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedId(template.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedId === template.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                            {getCategoryLabel(template.category)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📋 {template.structure.sections.length} 个章节</span>
                          <span>🔤 {template.structure.variables.length} 个变量</span>
                          <span>📊 使用 {template.usage_count || 0} 次</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                          <Copy size={16} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(template.id)
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              {/* Title */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{selectedTemplate.name}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(selectedTemplate.category)}`}>
                  {getCategoryLabel(selectedTemplate.category)}
                </span>
              </div>

              {/* Description */}
              {selectedTemplate.description && (
                <div>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
              )}

              {/* Sections */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">章节结构</h4>
                <ol className="space-y-1">
                  {selectedTemplate.structure.sections.map((section: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600">
                      {idx + 1}. {section}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Variables */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">模板变量</h4>
                <div className="space-y-1">
                  {selectedTemplate.structure.variables.map((variable: string, idx: number) => (
                    <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                      {variable}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">标签</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.tags.map((tag: string) => (
                      <span key={tag} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedTemplate.usage_count || 0}</p>
                  <p className="text-xs text-gray-600">使用次数</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTemplate.updated_at).toLocaleDateString('zh-CN')}
                  </p>
                  <p className="text-xs text-gray-600">最后更新</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Copy size={16} />
                  复制
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Plus size={16} />
                  使用
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
              选择一个模板查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

