import { NextRequest, NextResponse } from 'next/server'
import mediaData from '@/lib/data/media.json'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

let media = [...mediaData]
let nextId = Math.max(...media.map(m => m.id)) + 1

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')

    let filtered = [...media]

    if (type) {
      filtered = filtered.filter(m => m.type === type)
    }

    if (tag) {
      filtered = filtered.filter(m => m.tags?.includes(tag))
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(m =>
        m.filename.toLowerCase().includes(searchLower) ||
        m.description?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      data: filtered,
      total: filtered.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newMedia = {
      id: nextId++,
      ...body,
      uploadedAt: new Date().toISOString(),
      usedIn: [],
    }

    media.push(newMedia)

    return NextResponse.json(
      { data: newMedia, message: 'Media uploaded successfully' },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}

