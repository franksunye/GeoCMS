import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { randomUUID } from 'crypto'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, category, dimension, polarity, severity, scoreRange, description } = body
    
    // Simple validation
    if (!name || !code || !category || !dimension || !polarity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = randomUUID()
    
    const stmt = db.prepare(`
      INSERT INTO tags (id, name, code, category, dimension, polarity, severity, scoreRange, description, active, createdAt, updatedAt)
      VALUES (@id, @name, @code, @category, @dimension, @polarity, @severity, @scoreRange, @description, 1, datetime('now'), datetime('now'))
    `)
    
    stmt.run({
      id,
      name,
      code,
      category,
      dimension,
      polarity,
      severity: severity || '无',
      scoreRange: scoreRange || '1-5',
      description: description || ''
    })
    
    return NextResponse.json({ success: true, id, message: 'Tag created successfully' })
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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

    const stmt = db.prepare(`
      UPDATE tags 
      SET name = @name, 
          code = @code, 
          category = @category, 
          dimension = @dimension, 
          polarity = @polarity, 
          severity = @severity, 
          scoreRange = @scoreRange, 
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
      polarity,
      severity: severity || '无',
      scoreRange: scoreRange || '1-5',
      description: description || '',
      active: active ? 1 : 0
    })

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Tag updated successfully' })
  } catch (error: any) {
    console.error('Database Error:', error)
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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

    const stmt = db.prepare('DELETE FROM tags WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}


