import { NextRequest, NextResponse } from 'next/server'

type CallRecord = {
  id: number
  title: string
  customer_name: string
  timestamp: string
  duration_minutes: number
  overall_score: number
  riskScore: number
  opportunityScore: number
  overallQualityScore: number
  totalScore: number
  business_grade: 'High' | 'Medium' | 'Low'
  tags: string[]
  events: string[]
  behaviors: string[]
  service_issues: Array<{ tag: string; severity: 'high' | 'medium' | 'low' }>
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
    riskScore: 65,
    opportunityScore: 78,
    overallQualityScore: 72,
    totalScore: 72,
    business_grade: 'High',
    tags: ['first call', 'signal 17'],
    events: ['customer_pricing_request', 'customer_solution_request', 'customer_high_intent'],
    behaviors: ['listening_good', 'opening_complete', 'active_selling_proposition'],
    service_issues: [
      { tag: 'schedule_delay_customer_reason', severity: 'medium' },
      { tag: 'late_arrival', severity: 'low' },
      { tag: 'appointment_content', severity: 'low' },
    ],
  },
  {
    id: 2,
    title: 'Follow-up call - Product demo scheduling',
    customer_name: 'Ms. Li',
    timestamp: '2024-11-19T10:10:00Z',
    duration_minutes: 12,
    overall_score: 4.2,
    riskScore: 30,
    opportunityScore: 84,
    overallQualityScore: 80,
    totalScore: 78,
    business_grade: 'Medium',
    tags: ['follow-up', 'demo'],
    events: ['customer_schedule_request', 'customer_pricing_request'],
    behaviors: ['agent_positive_attitude', 'listening_good'],
    service_issues: [],
  },
  {
    id: 3,
    title: 'Support call - Ticket escalation',
    customer_name: 'Mr. Zhang',
    timestamp: '2024-11-20T14:45:00Z',
    duration_minutes: 22,
    overall_score: 2.8,
    riskScore: 82,
    opportunityScore: 40,
    overallQualityScore: 55,
    totalScore: 59,
    business_grade: 'Low',
    tags: ['support', 'escalation', 'urgent'],
    events: ['customer_pricing_request'],
    behaviors: ['agent_positive_attitude', 'same_day_visit_attempt'],
    service_issues: [
      { tag: 'sla_exceeded', severity: 'high' },
      { tag: 'callback_delay', severity: 'medium' },
    ],
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
