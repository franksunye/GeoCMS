import { NextRequest, NextResponse } from 'next/server'
import draftsData from '@/lib/data/drafts.json'
import { Draft, CreateDraftInput } from '@/types'

let drafts: Draft[] = [...(draftsData as Draft[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const planId = searchParams.get('plan_id')

  let filtered = drafts

  if (status) {
    filtered = filtered.filter(d => d.status === status)
  }

  if (planId) {
    filtered = filtered.filter(d => d.plan_id === parseInt(planId))
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateDraftInput = await request.json()

    const newDraft: Draft = {
      id: Date.now(),
      plan_id: body.plan_id,
      format: body.format || 'markdown',
      content: body.content,
      metadata: body.metadata,
      status: 'pending_edit',
      version: 1,
      reviewer_id: null,
      reviewer_feedback: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    drafts.push(newDraft)

    return NextResponse.json(newDraft, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

