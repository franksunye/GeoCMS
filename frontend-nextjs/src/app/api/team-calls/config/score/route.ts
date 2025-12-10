
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const config = db.prepare('SELECT * FROM score_config LIMIT 1').get()
    
    if (!config) {
      // Return default if no config exists
      return NextResponse.json({
        processWeight: 30,
        skillsWeight: 50,
        communicationWeight: 20,
        aggregationMethod: 'weighted-average'
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch score config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { processWeight, skillsWeight, communicationWeight, aggregationMethod, customFormula, description } = body
    
    // Check total weight
    if (processWeight + skillsWeight + communicationWeight !== 100) {
        return NextResponse.json({ error: 'Weights must sum to 100' }, { status: 400 })
    }

    const stmt = db.prepare(`
      INSERT INTO score_config (id, aggregationMethod, processWeight, skillsWeight, communicationWeight, customFormula, description, createdAt, updatedAt)
      VALUES ('1', @aggregationMethod, @processWeight, @skillsWeight, @communicationWeight, @customFormula, @description, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        aggregationMethod = excluded.aggregationMethod,
        processWeight = excluded.processWeight,
        skillsWeight = excluded.skillsWeight,
        communicationWeight = excluded.communicationWeight,
        customFormula = excluded.customFormula,
        description = excluded.description,
        updatedAt = datetime('now')
    `)
    
    stmt.run({
      aggregationMethod: aggregationMethod || 'weighted-average',
      processWeight,
      skillsWeight,
      communicationWeight,
      customFormula: customFormula || null,
      description: description || 'Default Config'
    })
    
    return NextResponse.json({ success: true, message: 'Score configuration saved' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to save score config' }, { status: 500 })
  }
}
