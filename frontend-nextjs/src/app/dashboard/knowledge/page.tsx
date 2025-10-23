'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Knowledge } from '@/types'
import { useState } from 'react'
import { Search, Trash2, Edit, BookOpen, Sparkles } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { AddKnowledgeDialog } from '@/components/knowledge/add-knowledge-dialog'
import { EditKnowledgeDialog } from '@/components/knowledge/edit-knowledge-dialog'
import { DeleteKnowledgeDialog } from '@/components/knowledge/delete-knowledge-dialog'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KnowledgeEnhancedList } from '@/components/knowledge/KnowledgeEnhancedList'

export default function KnowledgePage() {
  const [viewMode, setViewMode] = useState<'basic' | 'enhanced'>('enhanced')
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
        title: 'Deleted Successfully',
        description: 'Knowledge has been removed from the knowledge base',
      })
      setDeletingKnowledge(null)
    },
    onError: () => {
      toast({
        title: 'Delete Failed',
        description: 'An error occurred while deleting knowledge',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base Management</h1>
          <p className="mt-2 text-gray-600">Manage brand knowledge and materials</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('basic')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'basic'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic View
            </button>
            <button
              onClick={() => setViewMode('enhanced')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'enhanced'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Enhanced View
            </button>
          </div>
          <AddKnowledgeDialog />
        </div>
      </div>

      {viewMode === 'enhanced' ? (
        <KnowledgeEnhancedList />
      ) : (
        <div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            className="pl-10"
            placeholder="Search knowledge..."
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
                      Updated {formatRelativeTime(item.updated_at)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingKnowledge(item)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingKnowledge(item)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Knowledge</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start adding your first knowledge entry
            </p>
          </div>
        )}
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

