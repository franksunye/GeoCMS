import { NextRequest, NextResponse } from 'next/server'
import templatesData from '@/lib/data/templates.json'

let templates = [...templatesData]

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const item = templates.find(t => t.id === id)

    if (!item) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: transformTemplate(item) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const index = templates.findIndex(t => t.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Update with snake_case for storage
    templates[index] = {
      ...templates[index],
      name: body.name || templates[index].name,
      category: body.category || templates[index].category,
      description: body.description || templates[index].description,
      content_template: body.content || templates[index].content_template,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      data: transformTemplate(templates[index]),
      message: 'Template updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const index = templates.findIndex(t => t.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const deleted = templates.splice(index, 1)[0]

    return NextResponse.json({
      data: transformTemplate(deleted),
      message: 'Template deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

