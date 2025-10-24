'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, BookOpen, Tag, Folder, Clock } from 'lucide-react'
import axios from 'axios'

interface SearchResult {
  id: number
  type: 'draft' | 'plan' | 'knowledge' | 'category' | 'tag'
  title: string
  description?: string
  metadata?: Record<string, any>
}

export default function UnifiedSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('/api/search', {
          params: { q: query },
        })
        setResults(response.data)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'draft':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'plan':
        return <BookOpen className="h-4 w-4 text-purple-600" />
      case 'knowledge':
        return <BookOpen className="h-4 w-4 text-green-600" />
      case 'category':
        return <Folder className="h-4 w-4 text-orange-600" />
      case 'tag':
        return <Tag className="h-4 w-4 text-pink-600" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search drafts, plans, knowledge..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query ? (
            <>
              {isLoading && (
                <div className="p-4 text-center text-gray-500">
                  <div className="inline-block animate-spin">
                    <Search className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-sm">Searching...</p>
                </div>
              )}

              {!isLoading && results.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No results found for &quot;{query}&quot;</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="divide-y">
                  {results.map((result) => (
                    <a
                      key={`${result.type}-${result.id}`}
                      href={`/dashboard/${result.type}s/${result.id}`}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer"
                      onClick={() => {
                        setIsOpen(false)
                        handleSearch(query)
                      }}
                    >
                      <div className="mt-1">{getIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {result.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {getTypeLabel(result.type)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 border-b">
                    Recent Searches
                  </div>
                  <div className="divide-y">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-3 w-3 text-gray-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 border-b">
                Quick Links
              </div>
              <div className="divide-y">
                <a
                  href="/dashboard/drafts"
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  View All Drafts
                </a>
                <a
                  href="/dashboard/planning"
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  View All Plans
                </a>
                <a
                  href="/dashboard/knowledge"
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4 text-green-600" />
                  View Knowledge Base
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

