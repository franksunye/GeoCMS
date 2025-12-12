import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        avatarId: true,
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(agents)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}
