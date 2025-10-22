import { NextResponse } from 'next/server'
import knowledgeData from '@/lib/data/knowledge.json'
import plansData from '@/lib/data/plans.json'
import draftsData from '@/lib/data/drafts.json'
import { Stats } from '@/types'

export async function GET() {
  const plansByStatus = plansData.reduce((acc, plan) => {
    acc[plan.status] = (acc[plan.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const draftsByStatus = draftsData.reduce((acc, draft) => {
    acc[draft.status] = (acc[draft.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats: Stats = {
    totalKnowledge: knowledgeData.length,
    totalPlans: plansData.length,
    totalDrafts: draftsData.length,
    publishedContent: draftsData.filter(d => d.status === '已发布').length,
    plansByStatus,
    draftsByStatus,
  }

  return NextResponse.json(stats)
}

