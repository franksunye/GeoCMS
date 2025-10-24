'use client'

import { useState } from 'react'
import { FileText, Music, Video, Trash2, Eye } from 'lucide-react'
import Image from 'next/image'

interface MediaFile {
  id: number
  filename: string
  type: 'image' | 'document' | 'video' | 'audio'
  url: string
  size: number
  tags: string[]
  description: string
  uploadedAt: string
  usedIn: Array<{ type: string; id: number; title: string }>
}

interface MediaGridProps {
  media: MediaFile[]
  selectedItems: number[]
  onSelectItem: (id: number) => void
  onDelete: (id: number) => void
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'document':
      return <FileText className="h-8 w-8 text-blue-600" />
    case 'video':
      return <Video className="h-8 w-8 text-red-600" />
    case 'audio':
      return <Music className="h-8 w-8 text-purple-600" />
    default:
      return null
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default function MediaGrid({
  media,
  selectedItems,
  onSelectItem,
  onDelete,
}: MediaGridProps) {
  const [previewId, setPreviewId] = useState<number | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {media.map((file) => (
          <div
            key={file.id}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              selectedItems.includes(file.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectItem(file.id)}
          >
            {/* Thumbnail */}
            <div className="relative w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {getFileIcon(file.type)}
                  <span className="text-xs text-gray-600 text-center px-2">
                    {file.type.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewId(file.id)
                  }}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(file.id)
                  }}
                  className="p-2 bg-white rounded-full hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>

              {/* Checkbox */}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(file.id)}
                  onChange={() => onSelectItem(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-white">
              <h3 className="font-medium text-sm text-gray-900 truncate">
                {file.filename}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(file.size)}
              </p>
              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {file.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {file.tags.length > 2 && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      +{file.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewId !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {media.find((m) => m.id === previewId) && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">
                  {media.find((m) => m.id === previewId)?.filename}
                </h2>
                {media.find((m) => m.id === previewId)?.type === 'image' && (
                  <img
                    src={media.find((m) => m.id === previewId)?.url}
                    alt="preview"
                    className="w-full rounded-lg"
                  />
                )}
                <p className="text-sm text-gray-600 mt-4">
                  {media.find((m) => m.id === previewId)?.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

