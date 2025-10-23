import { NextRequest, NextResponse } from 'next/server'
import plansData from '@/lib/data/plans.json'
import { Plan, UpdatePlanInput } from '@/types'

let plans: Plan[] = [...(plansData as Plan[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const plan = plans.find(p => p.id === id)

  if (!plan) {
    return NextResponse.json(
      { error: 'Plan not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(plan)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body: UpdatePlanInput = await request.json()

    const index = plans.findIndex(p => p.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    plans[index] = {
      ...plans[index],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(plans[index])
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

// PATCH method for partial updates (used by Kanban board)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const index = plans.findIndex(p => p.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    plans[index] = {
      ...plans[index],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(plans[index])
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const index = plans.findIndex(p => p.id === id)

  if (index === -1) {
    return NextResponse.json(
      { error: 'Plan not found' },
      { status: 404 }
    )
  }

  plans.splice(index, 1)

  return NextResponse.json({ message: 'Plan deleted successfully' })
}

