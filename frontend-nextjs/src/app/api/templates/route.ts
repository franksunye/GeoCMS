import { NextRequest, NextResponse } from 'next/server'
import templatesData from '@/lib/data/templates.json'

let templates = [...templatesData]
let nextId = Math.max(...templates.map(t => t.id)) + 1

// Transform template data from snake_case to camelCase
function transformTemplate(template: any) {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    content: template.content_template || template.content || '',
    variables: Array.isArray(template.structure?.variables)
      ? template.structure.variables.map((v: string) => ({
          name: v.replace(/[{}]/g, ''),
          type: 'string',
          required: false
        }))
      : [],
    usageCount: template.usage_count || 0,
    createdAt: template.created_at || new Date().toISOString(),
  }
}

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

    // Transform data to camelCase
    const transformedData = filtered.map(transformTemplate)

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length,
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
      name: body.name,
      category: body.category,
      description: body.description,
      content_template: body.content || body.content_template,
      structure: {
        sections: body.sections || [],
        variables: body.variables?.map((v: any) => `{{${v.name}}}`) || []
      },
      tags: body.tags || [],
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    templates.push(newTemplate)

    return NextResponse.json(
      { data: transformTemplate(newTemplate), message: 'Template created successfully' },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

