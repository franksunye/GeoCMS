import { NextRequest, NextResponse } from 'next/server'
import draftsData from '@/lib/data/drafts.json'
import categoriesData from '@/lib/data/categories.json'
import tagsData from '@/lib/data/tags.json'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string | number
  type: 'draft' | 'category' | 'tag'
  title: string
  description: string
  metadata: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.toLowerCase() || ''

    if (!query) {
      return NextResponse.json([])
    }

    const results: SearchResult[] = []

    // Search drafts
    const drafts = draftsData as any[]
    drafts.forEach((draft) => {
      if (
        draft.metadata.title.toLowerCase().includes(query) ||
        draft.metadata.keywords.some((k: string) => k.toLowerCase().includes(query)) ||
        draft.content.toLowerCase().includes(query)
      ) {
        results.push({
          id: draft.id,
          type: 'draft',
          title: draft.metadata.title,
          description: draft.content.substring(0, 100),
          metadata: { status: draft.status, word_count: draft.metadata.word_count },
        })
      }
    })

    // Search categories
    const categories = categoriesData as any[]
    categories.forEach((category) => {
      if (
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
      ) {
        results.push({
          id: category.id,
          type: 'category',
          title: category.name,
          description: category.description,
          metadata: { color: category.color },
        })
      }
    })

    // Search tags
    const tags = tagsData as any[]
    tags.forEach((tag) => {
      if (
        tag.name.toLowerCase().includes(query) ||
        tag.description.toLowerCase().includes(query)
      ) {
        results.push({
          id: tag.id,
          type: 'tag',
          title: tag.name,
          description: tag.description,
          metadata: { color: tag.color },
        })
      }
    })

    return NextResponse.json(results.slice(0, 10))
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

