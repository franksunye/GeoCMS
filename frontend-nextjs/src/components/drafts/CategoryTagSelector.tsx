'use client'

import { useState, useEffect } from 'react'
import { Category, Tag } from '@/types'
import { X, Plus } from 'lucide-react'
import axios from 'axios'

interface CategoryTagSelectorProps {
  selectedCategoryId?: number | null
  selectedTagIds?: number[]
  onCategoryChange?: (categoryId: number | null) => void
  onTagsChange?: (tagIds: number[]) => void
}

export default function CategoryTagSelector({
  selectedCategoryId,
  selectedTagIds = [],
  onCategoryChange,
  onTagsChange,
}: CategoryTagSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingTags, setIsLoadingTags] = useState(true)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  useEffect(() => {
    // Fetch categories
    axios
      .get('/api/categories')
      .then((res) => {
        setCategories(res.data)
        setIsLoadingCategories(false)
      })
      .catch(() => setIsLoadingCategories(false))

    // Fetch tags
    axios
      .get('/api/tags')
      .then((res) => {
        setTags(res.data)
        setIsLoadingTags(false)
      })
      .catch(() => setIsLoadingTags(false))
  }, [])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id))

  const handleCategorySelect = (categoryId: number) => {
    onCategoryChange?.(categoryId)
    setShowCategoryDropdown(false)
  }

  const handleTagToggle = (tagId: number) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId]
    onTagsChange?.(newTagIds)
  }

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm hover:border-gray-400 transition-colors"
          >
            {isLoadingCategories ? (
              <span className="text-gray-500">Loading...</span>
            ) : selectedCategory ? (
              <span className="text-gray-900">{selectedCategory.name}</span>
            ) : (
              <span className="text-gray-500">Select a category</span>
            )}
          </button>

          {showCategoryDropdown && !isLoadingCategories && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  onCategoryChange?.(null)
                  setShowCategoryDropdown(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-200"
              >
                Clear category
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    selectedCategoryId === category.id
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-500">{category.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Tags</label>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleTagToggle(tag.id)}
                  className="hover:text-blue-900 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tag Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm hover:border-gray-400 transition-colors flex items-center justify-between"
          >
            <span className="text-gray-500">
              {isLoadingTags ? 'Loading...' : 'Add tags'}
            </span>
            <Plus className="h-4 w-4 text-gray-400" />
          </button>

          {showTagDropdown && !isLoadingTags && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {tags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No tags available</div>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <span>{tag.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

