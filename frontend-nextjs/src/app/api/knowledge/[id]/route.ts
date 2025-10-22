import { NextRequest, NextResponse } from 'next/server'
import knowledgeData from '@/lib/data/knowledge.json'
import { Knowledge, UpdateKnowledgeInput } from '@/types'

// In-memory storage (shared with parent route)
let knowledge: Knowledge[] = [...(knowledgeData as Knowledge[])]

// GET /api/knowledge/:id - Get single knowledge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const item = knowledge.find(k => k.id === id)

  if (!item) {
    return NextResponse.json(
      { error: 'Knowledge not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(item)
}

// PUT /api/knowledge/:id - Update knowledge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body: UpdateKnowledgeInput = await request.json()

    const index = knowledge.findIndex(k => k.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Knowledge not found' },
        { status: 404 }
      )
    }

    knowledge[index] = {
      ...knowledge[index],
      ...(body.topic && { topic: body.topic }),
      ...(body.content && { content: body.content }),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(knowledge[index])
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// DELETE /api/knowledge/:id - Delete knowledge
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const index = knowledge.findIndex(k => k.id === id)

  if (index === -1) {
    return NextResponse.json(
      { error: 'Knowledge not found' },
      { status: 404 }
    )
  }

  knowledge.splice(index, 1)

  return NextResponse.json({ message: 'Knowledge deleted successfully' })
}

