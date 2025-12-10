import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const rules = db.prepare('SELECT * FROM scoring_rules ORDER BY createdAt DESC').all()
    // Convert active from 1/0 to boolean
    const formattedRules = rules.map((rule: any) => ({
      ...rule,
      active: Boolean(rule.active)
    }))
    return NextResponse.json(formattedRules)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch scoring rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, appliesTo, description, ruleType, tagCode, targetDimension, scoreAdjustment, weight } = body
    
    // Simple validation
    if (!name || !tagCode || !targetDimension) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = randomUUID()
    
    const stmt = db.prepare(`
      INSERT INTO scoring_rules (id, name, appliesTo, description, active, ruleType, tagCode, targetDimension, scoreAdjustment, weight, createdAt, updatedAt)
      VALUES (@id, @name, @appliesTo, @description, 1, @ruleType, @tagCode, @targetDimension, @scoreAdjustment, @weight, datetime('now'), datetime('now'))
    `)
    
    stmt.run({
      id,
      name,
      appliesTo: appliesTo || 'Calls',
      description: description || '',
      ruleType: ruleType || 'TagBased',
      tagCode,
      targetDimension,
      scoreAdjustment: scoreAdjustment || 0,
      weight: weight || 1.0
    })
    
    return NextResponse.json({ success: true, id, message: 'Rule created successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, appliesTo, description, active, ruleType, tagCode, targetDimension, scoreAdjustment, weight } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const stmt = db.prepare(`
      UPDATE scoring_rules 
      SET name = @name, 
          appliesTo = @appliesTo, 
          description = @description, 
          active = @active, 
          ruleType = @ruleType, 
          tagCode = @tagCode, 
          targetDimension = @targetDimension, 
          scoreAdjustment = @scoreAdjustment, 
          weight = @weight, 
          updatedAt = datetime('now')
      WHERE id = @id
    `)
    
    const result = stmt.run({
      id,
      name,
      appliesTo: appliesTo || 'Calls',
      description: description || '',
      active: active ? 1 : 0,
      ruleType: ruleType || 'TagBased',
      tagCode,
      targetDimension,
      scoreAdjustment: scoreAdjustment || 0,
      weight: weight || 1.0
    })

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Rule updated successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const stmt = db.prepare('DELETE FROM scoring_rules WHERE id = ?')
    const result = stmt.run(id)

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Rule deleted successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}


