import { NextRequest, NextResponse } from 'next/server'
import templatesData from '@/lib/data/templates.json'

let templates = [...templatesData]

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

    return NextResponse.json({ data: item })
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

    templates[index] = {
      ...templates[index],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      data: templates[index],
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
      data: deleted,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

