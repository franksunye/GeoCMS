'use client'

import { FileText, Music, Video, Trash2, Image as ImageIcon } from 'lucide-react'

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

interface MediaListProps {
  media: MediaFile[]
  selectedItems: number[]
  onSelectItem: (id: number) => void
  onDelete: (id: number) => void
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-4 w-4 text-blue-600" />
    case 'document':
      return <FileText className="h-4 w-4 text-blue-600" />
    case 'video':
      return <Video className="h-4 w-4 text-red-600" />
    case 'audio':
      return <Music className="h-4 w-4 text-purple-600" />
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function MediaList({
  media,
  selectedItems,
  onSelectItem,
  onDelete,
}: MediaListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedItems.length === media.length && media.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    media.forEach((m) => {
                      if (!selectedItems.includes(m.id)) {
                        onSelectItem(m.id)
                      }
                    })
                  } else {
                    media.forEach((m) => {
                      if (selectedItems.includes(m.id)) {
                        onSelectItem(m.id)
                      }
                    })
                  }
                }}
                className="w-4 h-4 rounded border-gray-300"
              />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Filename
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Type
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Size
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Tags
            </th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {media.map((file) => (
            <tr
              key={file.id}
              className={`hover:bg-gray-50 transition-colors ${
                selectedItems.includes(file.id) ? 'bg-blue-50' : ''
              }`}
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(file.id)}
                  onChange={() => onSelectItem(file.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <span className="text-sm font-medium text-gray-900">
                    {file.filename}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600 capitalize">
                  {file.type}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">
                  {formatFileSize(file.size)}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">
                  {formatDate(file.uploadedAt)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
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
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(file.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

