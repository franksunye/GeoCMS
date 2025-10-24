import { NextRequest, NextResponse } from 'next/server'
import publishingData from '@/lib/data/publishing.json'

let publishing = [...publishingData]
let nextId = Math.max(...publishing.map(p => p.id)) + 1

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')

    let filtered = [...publishing]

    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }

    if (channel) {
      filtered = filtered.filter(p => p.channel === channel)
    }

    // Sort by updated_at descending
    filtered.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    return NextResponse.json({
      data: filtered,
      total: filtered.length,
      stats: {
        draft: filtered.filter(p => p.status === 'draft').length,
        pending_review: filtered.filter(p => p.status === 'pending_review').length,
        published: filtered.filter(p => p.status === 'published').length,
        archived: filtered.filter(p => p.status === 'archived').length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch publishing' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newPublishing = {
      id: nextId++,
      status: 'draft',
      checklist: {
        titleReview: false,
        contentReview: false,
        seoOptimization: false,
        imageSelection: false,
        metaDescription: false,
      },
      history: [
        {
          status: 'draft',
          timestamp: new Date().toISOString(),
          actor: 'user_001',
          note: 'Draft created',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    }

    publishing.push(newPublishing)

    return NextResponse.json(
      { data: newPublishing, message: 'Publishing created successfully' },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create publishing' },
      { status: 500 }
    )
  }
}

