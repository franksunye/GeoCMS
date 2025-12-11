
export type TranscriptEntry = {
  timestamp: number
  speaker: 'agent' | 'customer'
  text: string
}

export type Signal = {
  tag: string
  name?: string
  dimension: string
  score: number
  confidence: number
  reasoning: string
  context: string
  timestamp: number
  polarity?: string
  is_mandatory?: boolean
  occurrences?: {
    timestamp: number | null
    context: string
    reasoning: string
    confidence: number
  }[]
}

export type CallRecord = {
  id: string | number
  title: string
  customer_name: string
  timestamp: string
  duration_minutes: number
  processScore: number
  skillsScore: number
  communicationScore: number
  overallQualityScore: number
  business_grade: 'High' | 'Medium' | 'Low'
  tags: string[]
  events: string[]
  behaviors: string[]
  service_issues: Array<{ tag: string; severity: 'high' | 'medium' | 'low' }>
  signals?: Signal[] // Rich signal data from database
  transcript: TranscriptEntry[]
  audioUrl?: string
  agentId?: string // Added for filtering
  agentName?: string
  agentAvatarId?: string
}

// Demo data
export const MOCK_CALLS: CallRecord[] = [
  {
    id: 1,
    title: 'First phone call - On-site appointment',
    customer_name: 'Mr. Wang',
    agentName: 'Sarah',
    timestamp: '2024-11-17T18:25:00Z',
    duration_minutes: 16,
    processScore: 65,
    skillsScore: 78,
    communicationScore: 75,
    overallQualityScore: 72,
    business_grade: 'High',
    tags: ['first call', 'signal 17'],
    events: ['customer_pricing_request', 'customer_solution_request', 'customer_high_intent'],
    behaviors: ['listening_good', 'opening_complete', 'active_selling_proposition'],
    service_issues: [
      { tag: 'schedule_delay_customer_reason', severity: 'medium' },
      { tag: 'late_arrival', severity: 'low' },
      { tag: 'appointment_content', severity: 'low' },
    ],
    transcript: [
      { timestamp: 0, speaker: 'agent', text: 'Hello Mr. Wang, this is Sarah from GeoCMS Sales. How are you doing today?' },
      { timestamp: 5, speaker: 'customer', text: 'Hi Sarah, I\'m doing well, thank you for calling.' },
      { timestamp: 10, speaker: 'agent', text: 'Great! I wanted to reach out because I think our AI-powered content management system could be a perfect fit for your business needs.' },
      { timestamp: 20, speaker: 'customer', text: 'That sounds interesting. What exactly does it do?' },
      { timestamp: 25, speaker: 'agent', text: 'Our platform helps streamline your content creation process with intelligent automation. We\'ve helped companies like yours reduce content creation time by 40% while improving quality.' },
      { timestamp: 40, speaker: 'customer', text: 'What are the pricing options?' },
      { timestamp: 45, speaker: 'agent', text: 'We have flexible pricing starting from $99/month for small teams. I\'d love to schedule a quick 30-minute demo tomorrow to show you exactly how it works.' },
      { timestamp: 60, speaker: 'customer', text: 'Tomorrow works for me. What time would be good?' },
      { timestamp: 65, speaker: 'agent', text: 'Perfect! How about 2 PM? I can send you a calendar invite right away.' },
      { timestamp: 75, speaker: 'customer', text: 'That sounds great, Sarah. I look forward to it.' },
      { timestamp: 80, speaker: 'agent', text: 'Wonderful! I\'ll send you the invite now. Thank you for your time, Mr. Wang. See you tomorrow!' },
    ],
  },
  {
    id: 2,
    title: 'Follow-up call - Product demo scheduling',
    customer_name: 'Ms. Li',
    agentName: 'John',
    timestamp: '2024-11-19T10:10:00Z',
    duration_minutes: 12,
    processScore: 80,
    skillsScore: 84,
    communicationScore: 82,
    overallQualityScore: 80,
    business_grade: 'Medium',
    tags: ['follow-up', 'demo'],
    events: ['customer_schedule_request', 'customer_pricing_request'],
    behaviors: ['agent_positive_attitude', 'listening_good'],
    service_issues: [],
    transcript: [
      { timestamp: 0, speaker: 'agent', text: 'Hi Ms. Li, thanks for joining the demo call today!' },
      { timestamp: 5, speaker: 'customer', text: 'Hi John, thanks for setting this up. I\'m excited to see what this platform can do.' },
      { timestamp: 15, speaker: 'agent', text: 'Awesome! Let me walk you through the dashboard first. As you can see, it gives you a complete overview of all your content in one place.' },
      { timestamp: 30, speaker: 'customer', text: 'That\'s really clean and intuitive. How easy is it to set up?' },
      { timestamp: 35, speaker: 'agent', text: 'Setup takes about 15 minutes. We have templates for most industries, so you can get started right away.' },
      { timestamp: 45, speaker: 'customer', text: 'What about integrations with our existing tools?' },
      { timestamp: 50, speaker: 'agent', text: 'We integrate with 50+ tools including Slack, HubSpot, and Google Drive. Let me show you the integration panel.' },
      { timestamp: 70, speaker: 'customer', text: 'This looks really promising. When can we start?' },
      { timestamp: 75, speaker: 'agent', text: 'We can get you onboarded this week! I\'ll send you the documentation and schedule a training session.' },
    ],
  },
  {
    id: 3,
    title: 'Support call - Ticket escalation',
    customer_name: 'Mr. Zhang',
    agentName: 'Tom',
    timestamp: '2024-11-20T14:45:00Z',
    duration_minutes: 22,
    processScore: 45,
    skillsScore: 40,
    communicationScore: 45,
    overallQualityScore: 55,
    business_grade: 'Low',
    tags: ['support', 'escalation', 'urgent'],
    events: ['customer_pricing_request'],
    behaviors: ['agent_positive_attitude', 'same_day_visit_attempt'],
    service_issues: [
      { tag: 'sla_exceeded', severity: 'high' },
      { tag: 'callback_delay', severity: 'medium' },
    ],
    transcript: [
      { timestamp: 0, speaker: 'customer', text: 'Hi, I\'ve been waiting for 3 hours for support. This is unacceptable!' },
      { timestamp: 8, speaker: 'agent', text: 'I sincerely apologize for the wait. I\'m Tom from the support team. Let me help you right away.' },
      { timestamp: 15, speaker: 'customer', text: 'Our system went down last night and we haven\'t been able to access any content since then.' },
      { timestamp: 22, speaker: 'agent', text: 'I understand how critical this is. Let me check our system status immediately.' },
      { timestamp: 30, speaker: 'agent', text: 'I see there was an infrastructure issue. Our team is already working on it. You should see service restored within 30 minutes.' },
      { timestamp: 40, speaker: 'customer', text: 'This is the second time this month this has happened. I need someone senior to look into this.' },
      { timestamp: 48, speaker: 'agent', text: 'You\'re absolutely right to escalate this. I\'m connecting you with our Senior Support Engineer right now.' },
      { timestamp: 55, speaker: 'agent', text: 'I\'ve also waived your support fees for this month as a gesture of goodwill.' },
      { timestamp: 65, speaker: 'customer', text: 'I appreciate that. Please have someone from your team reach out to discuss preventing this in the future.' },
      { timestamp: 72, speaker: 'agent', text: 'Absolutely. Our senior engineer will contact you first thing tomorrow morning with a comprehensive solution.' },
    ],
  },
]
