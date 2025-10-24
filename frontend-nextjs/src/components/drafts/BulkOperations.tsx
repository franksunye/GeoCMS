'use client'

import { useState } from 'react'
import { CheckCircle, Trash2, Tag, Folder, Archive, Copy } from 'lucide-react'
import axios from 'axios'

interface BulkOperationsProps {
  selectedIds: number[]
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function BulkOperations({
  selectedIds,
  onSuccess,
  onError,
}: BulkOperationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (selectedIds.length === 0) {
    return null
  }

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      setIsLoading(true)
      await axios.post('/api/drafts/bulk', {
        action,
        draft_ids: selectedIds,
        data,
      })
      onSuccess?.()
      setIsOpen(false)
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Action Button */}
      <div className="flex items-center gap-2">
        {isOpen && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-2 space-y-1">
            <button
              onClick={() => handleBulkAction('add_tag')}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Tag className="h-4 w-4" />
              Add Tags
            </button>
            <button
              onClick={() => handleBulkAction('add_category')}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Folder className="h-4 w-4" />
              Add Category
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
            <button
              onClick={() => handleBulkAction('duplicate')}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <div className="border-t border-gray-200 pt-1">
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <CheckCircle className="h-5 w-5" />
          {selectedIds.length}
        </button>
      </div>

      {/* Selection Info */}
      <div className="absolute bottom-16 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-700 whitespace-nowrap">
        {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  )
}

