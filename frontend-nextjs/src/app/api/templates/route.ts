import { NextRequest, NextResponse } from 'next/server'
import templatesData from '@/lib/data/templates.json'

let templates = [...templatesData]
let nextId = Math.max(...templates.map(t => t.id)) + 1

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let filtered = [...templates]

    if (category) {
      filtered = filtered.filter(t => t.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by usage_count descending
    filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))

    return NextResponse.json({
      data: filtered,
      total: filtered.length,
      categories: ['blog', 'website', 'product', 'faq', 'custom'],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newTemplate = {
      id: nextId++,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    }

    templates.push(newTemplate)

    return NextResponse.json(
      { data: newTemplate, message: 'Template created successfully' },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

