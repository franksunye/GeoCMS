import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const agents = db.prepare('SELECT id, name, avatarId FROM agents ORDER BY name ASC').all()
    return NextResponse.json(agents)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}
