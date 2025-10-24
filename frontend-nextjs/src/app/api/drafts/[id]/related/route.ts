import { NextRequest, NextResponse } from 'next/server'
import draftsData from '@/lib/data/drafts.json'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = parseInt(params.id)
    const keywords = request.nextUrl.searchParams.get('keywords')?.split(',') || []

    const drafts = draftsData as any[]
    const currentDraft = drafts.find((d) => d.id === draftId)

    if (!currentDraft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Find related drafts based on keywords
    const relatedDrafts = drafts
      .filter((d) => d.id !== draftId)
      .filter((d) => {
        const draftKeywords = d.metadata.keywords.map((k: string) => k.toLowerCase())
        return keywords.some((k) =>
          draftKeywords.some((dk: string) => dk.includes(k.toLowerCase()))
        )
      })
      .slice(0, 3)

    // Mock related plans and knowledge
    const relatedPlans = [
      {
        id: 1,
        title: 'Content Strategy Planning',
        status: 'in_progress',
      },
      {
        id: 2,
        title: 'Q1 Marketing Campaign',
        status: 'completed',
      },
    ]

    const relatedKnowledge = [
      {
        id: 1,
        topic: 'AI Content Generation Best Practices',
        description: 'Guidelines for using AI tools effectively',
      },
      {
        id: 2,
        topic: 'Content Marketing ROI Metrics',
        description: 'How to measure content marketing success',
      },
    ]

    return NextResponse.json({
      drafts: relatedDrafts,
      plans: relatedPlans,
      knowledge: relatedKnowledge,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch related content' },
      { status: 500 }
    )
  }
}

