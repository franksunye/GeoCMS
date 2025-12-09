import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    // 1. Fetch Calls with Agent info and Transcript content
    // Note: calls.id corresponds to dealId
    // Use subquery for transcript content to avoid duplication if multiple transcripts exist for a deal
    const calls = db.prepare(`
      SELECT 
        c.id, 
        c.agentId, 
        c.startedAt, 
        c.duration, 
        c.outcome, 
        c.audioUrl,
        a.name as agentName,
        a.avatarId as agentAvatarId,
        (SELECT content FROM transcripts t WHERE t.dealId = c.id ORDER BY t.createdAt DESC LIMIT 1) as transcriptContent
      FROM calls c
      LEFT JOIN agents a ON c.agentId = a.id
      ORDER BY c.startedAt DESC
    `).all()

    // 2. Fetch all assessments to calculate scores and tags
    const assessments = db.prepare(`
      SELECT 
        ca.callId,
        ca.score,
        ca.confidence,
        ca.reasoning,
        ca.context_text,
        ca.timestamp_sec,
        t.name as tagName,
        t.code as tagCode,
        t.dimension,
        t.category,
        t.severity,
        t.polarity
      FROM call_assessments ca
      JOIN tags t ON ca.tagId = t.id
    `).all()

    // Group assessments by callId for efficient lookup
    const assessmentsByCall: Record<string, any[]> = {}
    assessments.forEach((a: any) => {
      if (!assessmentsByCall[a.callId]) {
        assessmentsByCall[a.callId] = []
      }
      assessmentsByCall[a.callId].push(a)
    })

    // 3. Transform to CallRecord format
    const formattedCalls = calls.map((call: any) => {
      const callAssessments = assessmentsByCall[call.id] || []

      // Helper to calculate average score for a dimension
      const getAvgScore = (dimensionPrefix: string) => {
        const scores = callAssessments
          .filter(a => a.dimension && a.dimension.startsWith(dimensionPrefix))
          .map(a => a.score)
        
        if (scores.length === 0) return 0
        return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      }

      const processScore = getAvgScore('Sales.Process')
      const skillsScore = getAvgScore('Sales.Skills')
      const communicationScore = getAvgScore('Sales.Communication')
      
      // Calculate overall quality score (simple average of dimensions)
      const overallQualityScore = Math.round((processScore + skillsScore + communicationScore) / 3)

      // Collect tags and events
      // events: we can consider all tags as events or filter specific categories
      const tags = Array.from(new Set(callAssessments.map((a: any) => a.tagName)))
      
      // behaviors: filtered by specific criteria or just all tags for now
      const behaviors = callAssessments
        .filter(a => a.category === 'Sales' || a.category === 'Communication')
        .map(a => a.tagCode)

      // service_issues
      const service_issues = callAssessments
        .filter(a => a.category === 'Service Issue')
        .map(a => ({
          tag: a.tagCode,
          severity: a.severity ? a.severity.toLowerCase() : 'low'
        }))

      // Signals (Full Detail)
      const signals = callAssessments.map((a: any) => {
        let timestamp = null
        if (a.timestamp_sec != null && call.startedAt) {
           timestamp = new Date(call.startedAt).getTime() + (a.timestamp_sec * 1000)
        }
        
        return {
          tag: a.tagCode,
          name: a.tagName,
          dimension: a.dimension || 'General',
          score: a.score != null ? a.score / 100 : null, // Normalize 0-100 to 0-1
          confidence: a.confidence,
          reasoning: a.reasoning,
          context: a.context_text,
          timestamp: timestamp,
          severity: a.severity ? a.severity.toLowerCase() : 'none',
          polarity: a.polarity ? a.polarity.toLowerCase() : 'neutral'
        }
      })

      // Parse Transcript
      let transcript: any[] = []
      try {
        if (call.transcriptContent) {
          const parsed = JSON.parse(call.transcriptContent)
          // Handle both array of objects or wrapped structure
          const transcriptData = Array.isArray(parsed) ? parsed : []
          
          transcript = transcriptData.map((entry: any) => ({
            timestamp: Math.round((entry.BeginTime || 0) / 1000), // Convert ms to seconds
            speaker: (entry.SpeakerId === '1' || entry.SpeakerId === 1) ? 'agent' : 'customer', // Heuristic: 1 is usually agent
            text: entry.Text || ''
          }))
        }
      } catch (e) {
        console.error(`Error parsing transcript for call ${call.id}:`, e)
      }

      return {
        id: call.id,
        agentId: call.agentId,
        agentName: call.agentName,
        agentAvatarId: call.agentAvatarId,
        title: `Call with ${call.agentName || 'Agent'}`, // Placeholder title
        customer_name: 'Customer', // Database doesn't have customer name yet
        timestamp: call.startedAt,
        duration_minutes: Math.round((call.duration || 0) / 60),
        processScore,
        skillsScore,
        communicationScore,
        overallQualityScore,
        business_grade: call.outcome === 'won' ? 'High' : (call.outcome === 'lost' ? 'Low' : 'Medium'),
        tags,
        events: behaviors, // Using behaviors as events for now to populate UI
        behaviors,
        service_issues,
        signals,
        transcript,
        audioUrl: call.audioUrl
      }
    })

    return NextResponse.json(formattedCalls)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
