import { NextRequest, NextResponse } from 'next/server'
import tagsData from '@/lib/data/tags.json'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(tagsData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

