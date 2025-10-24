'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import axios from 'axios'

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

interface MediaUploadProps {
  onClose: () => void
  onUpload: (media: MediaFile) => void
}

export default function MediaUpload({ onClose, onUpload }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [filename, setFilename] = useState('')
  const [type, setType] = useState<'image' | 'document' | 'video' | 'audio'>(
    'image'
  )
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setFilename(files[0].name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filename) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    try {
      const response = await axios.post('/api/media', {
        filename,
        type,
        url: `/media/${filename}`,
        size: Math.random() * 5000000,
        tags: tags.split(',').map((t) => t.trim()),
        description,
      })

      onUpload(response.data)
      setError('')
    } catch (err) {
      setError('Failed to upload media')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Upload Media</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Drag and drop your file here or click to select
            </p>
            {filename && (
              <p className="text-sm font-medium text-blue-600 mt-2">
                {filename}
              </p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Type
            </label>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'image' | 'document' | 'video' | 'audio')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this media file..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., product, hero, marketing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !filename}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

