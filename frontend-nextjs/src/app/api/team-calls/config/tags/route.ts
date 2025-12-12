import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const dimension = searchParams.get('dimension')
    const polarity = searchParams.get('polarity')
    const search = searchParams.get('search')
    const active = searchParams.get('active')

    const where: any = {}

    if (category) {
      where.category = category
    }
    if (dimension) {
      where.dimension = dimension
    }
    if (polarity) {
      where.polarity = polarity
    }
    if (active !== null) {
      where.active = active === 'true' ? 1 : 0
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ]
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Convert active from 1/0 to boolean
    const formattedTags = tags.map((tag) => ({
      ...tag,
      active: Boolean(tag.active),
      is_mandatory: Boolean(tag.isMandatory)
    }))
    return NextResponse.json(formattedTags)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, category, dimension, polarity, severity, scoreRange, description, is_mandatory } = body

    // Simple validation
    if (!name || !code || !category || !dimension || !polarity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    await prisma.tag.create({
      data: {
        id,
        name,
        code,
        category,
        dimension,
        isMandatory: is_mandatory ? true : false,
        polarity,
        severity: severity || '无',
        scoreRange: scoreRange || '1-5',
        description: description || '',
        active: 1,
        createdAt: now,
        updatedAt: now,
      }
    })

    return NextResponse.json({ success: true, id, message: 'Tag created successfully' })
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json({ error: 'Tag code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, code, category, dimension, polarity, severity, scoreRange, description, active } = body

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const result = await prisma.tag.updateMany({
      where: { id },
      data: {
        name,
        code,
        category,
        dimension,
        polarity,
        severity: severity || '无',
        scoreRange: scoreRange || '1-5',
        description: description || '',
        active: active ? 1 : 0,
        updatedAt: now,
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Tag updated successfully' })
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tag code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    const result = await prisma.tag.deleteMany({
      where: { id }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
