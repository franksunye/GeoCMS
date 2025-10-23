import { NextRequest, NextResponse } from 'next/server'
import draftsData from '@/lib/data/drafts.json'
import { Draft, UpdateDraftInput } from '@/types'

let drafts: Draft[] = [...(draftsData as Draft[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const draft = drafts.find(d => d.id === id)

  if (!draft) {
    return NextResponse.json(
      { error: 'Draft not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(draft)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body: UpdateDraftInput = await request.json()

    const index = drafts.findIndex(d => d.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    const currentVersion = drafts[index].version
    const currentDraft = drafts[index]

    drafts[index] = {
      ...currentDraft,
      ...(body.content && { content: body.content }),
      ...(body.status && { status: body.status }),
      ...(body.reviewer_feedback && { reviewer_feedback: body.reviewer_feedback }),
      ...(body.metadata && {
        metadata: {
          ...currentDraft.metadata,
          ...body.metadata
        }
      }),
      version: body.content ? currentVersion + 1 : currentVersion,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(drafts[index])
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const index = drafts.findIndex(d => d.id === id)

  if (index === -1) {
    return NextResponse.json(
      { error: 'Draft not found' },
      { status: 404 }
    )
  }

  drafts.splice(index, 1)

  return NextResponse.json({ message: 'Draft deleted successfully' })
}

