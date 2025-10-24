import { NextRequest, NextResponse } from 'next/server'
import categoriesData from '@/lib/data/categories.json'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(categoriesData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

