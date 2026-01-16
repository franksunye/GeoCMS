import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const rules = await prisma.scoringRule.findMany({
      orderBy: { createdAt: 'desc' }
    })
    // Convert active from 1/0 to boolean
    const formattedRules = rules.map((rule) => ({
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
    const now = new Date().toISOString()

    await prisma.scoringRule.create({
      data: {
        id,
        name,
        appliesTo: appliesTo || 'Calls',
        description: description || '',
        active: 1,
        ruleType: ruleType || 'TagBased',
        tagCode,
        targetDimension,
        scoreAdjustment: scoreAdjustment || 0,
        weight: weight || 1.0,
        createdAt: now,
        updatedAt: now,
      }
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

    const now = new Date().toISOString()

    const result = await prisma.scoringRule.updateMany({
      where: { id },
      data: {
        name,
        appliesTo: appliesTo || 'Calls',
        description: description || '',
        active: active ? 1 : 0,
        ruleType: ruleType || 'TagBased',
        tagCode,
        targetDimension,
        scoreAdjustment: scoreAdjustment || 0,
        weight: weight || 1.0,
        updatedAt: now,
      }
    })

    if (result.count === 0) {
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

    const result = await prisma.scoringRule.deleteMany({
      where: { id }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Rule deleted successfully' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}
