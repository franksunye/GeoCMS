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

    // 1.5 Get Score Config (for weights)
    const scoreConfig = db.prepare('SELECT * FROM score_config LIMIT 1').get() as any
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

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

    // 2.5 Get Mandatory Tags
    const mandatoryTags = db.prepare('SELECT code, name, dimension FROM tags WHERE is_mandatory = 1 AND active = 1').all() as any[]

    // Group mandatory tags by dimension for easier lookup
    // Since dimensions can be 'Process' or 'Sales.Process', we may just keep a flat list filtering inside the loop or pre-process here.
    // Let's keep distinct list per simple dimension name to match the helper's `dims` arg logic.
    const mandatoryTagsMap: Record<string, string[]> = {}
    mandatoryTags.forEach(t => {
      const dim = t.dimension; // e.g. "Process" or "Sales.Process"
      if (!mandatoryTagsMap[dim]) mandatoryTagsMap[dim] = []
      mandatoryTagsMap[dim].push(t.code)
    })

    // 3. Transform to CallRecord format
    const formattedCalls = calls.map((call: any) => {
      const callAssessments = assessmentsByCall[call.id] || []

      // Helper to calculate average score for a dimension (Hybrid: Assessed + Missing Mandatory)
      const getAvgScore = (dims: string[]) => {
        // 1. Get Assessed Scores
        const assessed = callAssessments.filter((a: any) =>
          a.dimension && dims.some((d: string) => a.dimension === d || a.dimension.startsWith(d + '.'))
        )

        let totalScore = assessed.reduce((sum: number, a: any) => sum + a.score, 0)
        let denominator = assessed.length

        // 2. Check Missing Mandatory Tags
        // Filter mandatory tags that belong to the current requested dimensions
        const relevantMandatoryTags = mandatoryTags.filter(t =>
          dims.some(d => t.dimension === d || t.dimension.startsWith(d + '.'))
        )

        for (const mTag of relevantMandatoryTags) {
          // Check if this mandatory tag is present in the current call's assessments
          // Note: Use tagCode for comparison
          const isAssessed = callAssessments.some((a: any) => a.tagCode === mTag.code)
          if (!isAssessed) {
            denominator++ // Count as 0 score
          }
        }

        if (denominator === 0) return 0
        return Math.round(totalScore / denominator)
      }

      const processScore = getAvgScore(['Sales.Process', 'Process'])
      const skillsScore = getAvgScore(['Sales.Skills', 'Skills'])
      const communicationScore = getAvgScore(['Sales.Communication', 'Communication'])

      // Calculate overall quality score (weighted average)
      const overallQualityScore = Math.round(
        (processScore * weights.process +
          skillsScore * weights.skills +
          communicationScore * weights.communication) / 100
      )

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

      // Signals: Use Assessments + Missing Mandatory (Scored View)
      const assessmentSignals = callAssessments.map((a: any) => ({
        tag: a.tagCode,
        name: a.tagName,
        dimension: a.dimension,
        score: a.score,
        confidence: a.confidence,
        reasoning: a.reasoning,
        context: a.context_text,
        timestamp: a.timestamp_sec ? new Date(call.startedAt).getTime() + (a.timestamp_sec * 1000) : null,
        severity: a.severity || 'none',
        polarity: a.polarity ? a.polarity.toLowerCase() : 'neutral',
        is_mandatory: false
      }))

      const missingSignals = []
      for (const mTag of mandatoryTags) {
        const isAssessed = callAssessments.some((a: any) => a.tagCode === mTag.code)
        if (!isAssessed) {
          missingSignals.push({
            tag: mTag.code,
            name: mTag.name,
            dimension: mTag.dimension,
            score: 0,
            confidence: 1.0,
            reasoning: 'Missing Mandatory Action (必选动作缺失)',
            context: 'Not detected in call',
            timestamp: null,
            severity: 'high',
            polarity: 'negative',
            is_mandatory: true
          })
        }
      }

      const signals = [...assessmentSignals, ...missingSignals]

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
