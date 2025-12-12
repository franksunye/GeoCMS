import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const signals = await prisma.signal.findMany({
      orderBy: { createdAt: 'desc' }
    })
    // Convert active from 1/0 to boolean
    const formattedSignals = signals.map((signal) => ({
      ...signal,
      active: Boolean(signal.active)
    }))
    return NextResponse.json(formattedSignals)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, category, dimension, targetTagCode, aggregationMethod, description } = body

    if (!name || !code || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    await prisma.signal.create({
      data: {
        id,
        name,
        code,
        category,
        dimension: dimension || '',
        targetTagCode: targetTagCode || '',
        aggregationMethod: aggregationMethod || 'Count',
        description: description || '',
        active: 1,
        createdAt: now,
        updatedAt: now,
      }
    })

    return NextResponse.json({ success: true, id, message: 'Signal created successfully' })
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Signal code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, code, category, dimension, targetTagCode, aggregationMethod, description, active } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const result = await prisma.signal.updateMany({
      where: { id },
      data: {
        name,
        code,
        category,
        dimension: dimension || '',
        targetTagCode: targetTagCode || '',
        aggregationMethod: aggregationMethod || 'Count',
        description: description || '',
        active: active ? 1 : 0,
        updatedAt: now,
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Signal updated successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to update signal' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const result = await prisma.signal.deleteMany({
      where: { id }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Signal deleted successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to delete signal' }, { status: 500 })
  }
}
