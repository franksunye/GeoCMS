import { NextRequest, NextResponse } from 'next/server'

type CallRecord = {
  id: number
  title: string
  customer_name: string
  timestamp: string
  duration_minutes: number
  overall_score: number
  business_grade: 'High' | 'Medium' | 'Low'
  tags: string[]
  events: string[]
  behaviors: string[]
  service_issues: string[]
}

// Demo data
const CALLS: CallRecord[] = [
  {
    id: 1,
    title: 'First phone call - On-site appointment',
    customer_name: 'Mr. Wang',
    timestamp: '2024-11-17T18:25:00Z',
    duration_minutes: 16,
    overall_score: 3.1,
    business_grade: 'High',
    tags: ['first call', 'signal 17'],
    events: ['pricing inquiry', 'rejection risk', 'high demand'],
    behaviors: ['active listening', 'readiness completeness', 'proactive selling behavior'],
    service_issues: ['customer waited too long', 'late arrival', 'appointment content'],
  },
  {
    id: 2,
    title: 'Follow-up call - Product demo scheduling',
    customer_name: 'Ms. Li',
    timestamp: '2024-11-19T10:10:00Z',
    duration_minutes: 12,
    overall_score: 4.2,
    business_grade: 'Medium',
    tags: ['follow-up', 'demo'],
    events: ['feature questions', 'budget discussion'],
    behaviors: ['clear explanation', 'objection handling'],
    service_issues: ['none'],
  },
  {
    id: 3,
    title: 'Support call - Ticket escalation',
    customer_name: 'Mr. Zhang',
    timestamp: '2024-11-20T14:45:00Z',
    duration_minutes: 22,
    overall_score: 2.8,
    business_grade: 'Low',
    tags: ['support', 'escalation', 'urgent'],
    events: ['error report', 'refund request'],
    behaviors: ['empathy', 'de-escalation'],
    service_issues: ['SLA exceeded', 'callback delay'],
  },
]

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(CALLS)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}

