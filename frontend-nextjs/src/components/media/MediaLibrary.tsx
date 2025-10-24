'use client'

import { useState, useEffect } from 'react'
import { Upload, Grid3x3, List, Search, Filter, Trash2 } from 'lucide-react'
import axios from 'axios'
import MediaGrid from './MediaGrid'
import MediaList from './MediaList'
import MediaUpload from './MediaUpload'

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

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [filteredMedia, setFilteredMedia] = useState<MediaFile[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showUpload, setShowUpload] = useState(false)

  // Fetch media
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await axios.get('/api/media')
        setMedia(response.data.data || [])
        setFilteredMedia(response.data.data || [])
      } catch (error) {
        console.error('Failed to fetch media:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [])

  // Filter media
  useEffect(() => {
    let results = [...media]

    if (selectedType !== 'all') {
      results = results.filter((m) => m.type === selectedType)
    }

    if (selectedTag !== 'all') {
      results = results.filter((m) => m.tags.includes(selectedTag))
    }

    if (searchQuery) {
      results = results.filter(
        (m) =>
          m.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredMedia(results)
  }, [media, selectedType, selectedTag, searchQuery])

  const handleDelete = (id: number) => {
    setMedia(media.filter((m) => m.id !== id))
    setSelectedItems(selectedItems.filter((item) => item !== id))
  }

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return
    setMedia(media.filter((m) => !selectedItems.includes(m.id)))
    setSelectedItems([])
  }

  const handleUpload = (newMedia: MediaFile) => {
    setMedia([newMedia, ...media])
    setShowUpload(false)
  }

  const allTags = Array.from(new Set(media.flatMap((m) => m.tags)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-2 text-gray-600">
            Manage your media files, images, and documents
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Media
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <MediaUpload
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <span className="text-sm text-blue-900">
              {selectedItems.length} item(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Media Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading media...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No media files found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <MediaGrid
          media={filteredMedia}
          selectedItems={selectedItems}
          onSelectItem={(id) => {
            setSelectedItems(
              selectedItems.includes(id)
                ? selectedItems.filter((item) => item !== id)
                : [...selectedItems, id]
            )
          }}
          onDelete={handleDelete}
        />
      ) : (
        <MediaList
          media={filteredMedia}
          selectedItems={selectedItems}
          onSelectItem={(id) => {
            setSelectedItems(
              selectedItems.includes(id)
                ? selectedItems.filter((item) => item !== id)
                : [...selectedItems, id]
            )
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

