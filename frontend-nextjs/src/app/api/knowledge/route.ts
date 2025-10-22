import { NextRequest, NextResponse } from 'next/server'
import knowledgeData from '@/lib/data/knowledge.json'
import { Knowledge, CreateKnowledgeInput } from '@/types'

// In-memory storage (resets on server restart)
let knowledge: Knowledge[] = [...(knowledgeData as Knowledge[])]

// GET /api/knowledge - Get all knowledge
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const topic = searchParams.get('topic')
  const search = searchParams.get('search')

  let filtered = knowledge

  // Filter by topic
  if (topic) {
    filtered = filtered.filter(k => k.topic === topic)
  }

  // Search in topic and content
  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(k => 
      k.topic.toLowerCase().includes(searchLower) ||
      JSON.stringify(k.content).toLowerCase().includes(searchLower)
    )
  }

  return NextResponse.json(filtered)
}

// POST /api/knowledge - Create new knowledge
export async function POST(request: NextRequest) {
  try {
    const body: CreateKnowledgeInput = await request.json()

    if (!body.topic || !body.content) {
      return NextResponse.json(
        { error: 'Topic and content are required' },
        { status: 400 }
      )
    }

    const newKnowledge: Knowledge = {
      id: Date.now(),
      topic: body.topic,
      content: body.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    knowledge.push(newKnowledge)

    return NextResponse.json(newKnowledge, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

