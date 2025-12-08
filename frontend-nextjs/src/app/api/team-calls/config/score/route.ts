
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
        aggregationMethod: 'weighted_average'
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch score config' }, { status: 500 })
  }
}
