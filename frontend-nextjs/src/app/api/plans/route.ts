import { NextRequest, NextResponse } from 'next/server'
import plansData from '@/lib/data/plans.json'
import { Plan, CreatePlanInput } from '@/types'

let plans: Plan[] = [...(plansData as Plan[])]

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')

  let filtered = plans

  if (status) {
    filtered = filtered.filter(p => p.status === status)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlanInput = await request.json()

    const newPlan: Plan = {
      id: Date.now(),
      user_id: 'demo_user',
      topic: body.topic,
      title: body.title,
      keywords: body.keywords,
      outline: body.outline,
      category: body.category,
      tags: body.tags,
      target_metric: body.target_metric || {},
      asset_requirements: body.asset_requirements || [],
      assets_provided: [],
      material_pack_id: `mp_${Date.now()}`,
      status: '待素材',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    plans.push(newPlan)

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

