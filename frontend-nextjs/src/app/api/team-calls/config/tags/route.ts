import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY createdAt DESC').all()
    // Convert active from 1/0 to boolean
    const formattedTags = tags.map((tag: any) => ({
      ...tag,
      active: Boolean(tag.active)
    }))
    return NextResponse.json(formattedTags)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
