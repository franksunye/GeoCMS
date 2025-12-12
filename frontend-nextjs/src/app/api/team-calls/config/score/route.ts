import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const config = await prisma.scoreConfig.findFirst()

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

    const now = new Date().toISOString()

    // Upsert: create or update
    await prisma.scoreConfig.upsert({
      where: { id: '1' },
      create: {
        id: '1',
        aggregationMethod: aggregationMethod || 'weighted-average',
        processWeight,
        skillsWeight,
        communicationWeight,
        customFormula: customFormula || null,
        description: description || 'Default Config',
        createdAt: now,
        updatedAt: now,
      },
      update: {
        aggregationMethod: aggregationMethod || 'weighted-average',
        processWeight,
        skillsWeight,
        communicationWeight,
        customFormula: customFormula || null,
        description: description || 'Default Config',
        updatedAt: now,
      }
    })

    return NextResponse.json({ success: true, message: 'Score configuration saved' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to save score config' }, { status: 500 })
  }
}
