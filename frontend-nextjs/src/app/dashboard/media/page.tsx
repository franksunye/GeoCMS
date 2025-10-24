'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Grid3x3, List, Trash2, Download, Tag } from 'lucide-react'
import { Media } from '@/types'

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')

  const { data: mediaList = [], isLoading } = useQuery({
    queryKey: ['media', searchTerm, filterType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType) params.append('type', filterType)

      const res = await fetch(`/api/media?${params}`)
      const json = await res.json()
      return json.data || []
    },
  })

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个媒体文件吗？')) {
      await fetch(`/api/media/${id}`, { method: 'DELETE' })
      // Refetch would happen automatically with React Query
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️'
      case 'video':
        return '🎬'
      case 'document':
        return '📄'
      default:
        return '📁'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-1">Manage and organize your media files</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Upload Media
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>

        <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No media files</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mediaList.map((item: Media) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl">
                {item.type === 'image' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(item.type)
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm truncate">{item.filename}</h3>
                <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center gap-1">
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Filename</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Size</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tags</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaList.map((item: Media) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{item.filename}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(item.size)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-1">
                      {item.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Files</p>
          <p className="text-2xl font-bold text-gray-900">{mediaList.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Images</p>
          <p className="text-2xl font-bold text-gray-900">
            {mediaList.filter((m: Media) => m.type === 'image').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Videos</p>
          <p className="text-2xl font-bold text-gray-900">
            {mediaList.filter((m: Media) => m.type === 'video').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Documents</p>
          <p className="text-2xl font-bold text-gray-900">
            {mediaList.filter((m: Media) => m.type === 'document').length}
          </p>
        </div>
      </div>
    </div>
  )
}

