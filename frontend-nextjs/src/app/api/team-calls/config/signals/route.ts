import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const signals = db.prepare('SELECT * FROM signals ORDER BY createdAt DESC').all()
    // Convert active from 1/0 to boolean
    const formattedSignals = signals.map((signal: any) => ({
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

    const stmt = db.prepare(`
      INSERT INTO signals (id, name, code, category, dimension, targetTagCode, aggregationMethod, description, active, createdAt, updatedAt)
      VALUES (@id, @name, @code, @category, @dimension, @targetTagCode, @aggregationMethod, @description, 1, datetime('now'), datetime('now'))
    `)

    stmt.run({
      id,
      name,
      code,
      category,
      dimension,
      targetTagCode: targetTagCode || '',
      aggregationMethod: aggregationMethod || 'Count',
      description: description || ''
    })

    return NextResponse.json({ success: true, id, message: 'Signal created successfully' })
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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

    const stmt = db.prepare(`
      UPDATE signals
      SET name = @name, 
          code = @code, 
          category = @category, 
          dimension = @dimension, 
          targetTagCode = @targetTagCode, 
          aggregationMethod = @aggregationMethod, 
          description = @description, 
          active = @active, 
          updatedAt = datetime('now')
      WHERE id = @id
    `)

    const result = stmt.run({
      id,
      name,
      code,
      category,
      dimension,
      targetTagCode: targetTagCode || '',
      aggregationMethod: aggregationMethod || 'Count',
      description: description || '',
      active: active ? 1 : 0
    })

    if (result.changes === 0) {
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

    const stmt = db.prepare('DELETE FROM signals WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Signal deleted successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to delete signal' }, { status: 500 })
  }
}
