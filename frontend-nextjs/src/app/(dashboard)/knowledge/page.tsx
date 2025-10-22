'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Knowledge } from '@/types'
import { useState } from 'react'
import { Search, Trash2, Edit, BookOpen } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { AddKnowledgeDialog } from '@/components/knowledge/add-knowledge-dialog'
import { EditKnowledgeDialog } from '@/components/knowledge/edit-knowledge-dialog'
import { DeleteKnowledgeDialog } from '@/components/knowledge/delete-knowledge-dialog'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null)
  const [deletingKnowledge, setDeletingKnowledge] = useState<Knowledge | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: knowledge, isLoading } = useQuery<Knowledge[]>({
    queryKey: ['knowledge', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? `?search=${searchTerm}` : ''
      const response = await axios.get(`/api/knowledge${params}`)
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/knowledge/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      toast({
        title: '删除成功',
        description: '知识已从知识库中删除',
      })
      setDeletingKnowledge(null)
    },
    onError: () => {
      toast({
        title: '删除失败',
        description: '删除知识时发生错误',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">知识库管理</h1>
          <p className="mt-2 text-gray-600">管理品牌知识和资料</p>
        </div>
        <AddKnowledgeDialog />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            className="pl-10"
            placeholder="搜索知识..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Knowledge List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {knowledge?.map((item) => (
            <li key={item.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.topic}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      更新于 {formatRelativeTime(item.updated_at)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingKnowledge(item)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingKnowledge(item)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(item.content, null, 2)}
                  </pre>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {knowledge?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无知识</h3>
          <p className="mt-1 text-sm text-gray-500">
            开始添加您的第一个知识条目
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      {editingKnowledge && (
        <EditKnowledgeDialog
          knowledge={editingKnowledge}
          open={!!editingKnowledge}
          onOpenChange={(open) => !open && setEditingKnowledge(null)}
        />
      )}

      {/* Delete Dialog */}
      <DeleteKnowledgeDialog
        knowledge={deletingKnowledge}
        open={!!deletingKnowledge}
        onOpenChange={(open) => !open && setDeletingKnowledge(null)}
        onConfirm={() => {
          if (deletingKnowledge) {
            deleteMutation.mutate(deletingKnowledge.id)
          }
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}

