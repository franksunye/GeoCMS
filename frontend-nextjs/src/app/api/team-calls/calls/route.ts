import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Calls')

export async function GET() {
  const totalTimer = logger.startTimer('Total API Request')

  try {
    // 1. Fetch Calls with Agent info
    const calls = await logger.time('Query: Calls with Agents', () =>
      prisma.call.findMany({
        include: {
          agent: {
            select: { name: true, avatarId: true }
          }
        },
        orderBy: { startedAt: 'desc' }
      })
    )

    logger.info('Calls fetched', { count: calls.length })

    // 1.5 Get Score Config (for weights)
    const scoreConfig = await logger.time('Query: Score Config', () => prisma.scoreConfig.findFirst())
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

    // 2. Fetch all assessments to calculate scores and tags
    const allAssessments = await logger.time('Query: All Assessments', () =>
      prisma.callAssessment.findMany({
        include: {
          tag: {
            select: { name: true, code: true, dimension: true, category: true, severity: true, polarity: true }
          }
        }
      })
    )

    logger.info('Assessments fetched', { count: allAssessments.length })

    // Group assessments by callId for efficient lookup
    const assessmentsByCall: Record<string, typeof allAssessments> = {}
    allAssessments.forEach(a => {
      if (!assessmentsByCall[a.callId]) {
        assessmentsByCall[a.callId] = []
      }
      assessmentsByCall[a.callId].push(a)
    })

    // 2.5 Get Mandatory Tags
    const mandatoryTags = await logger.time('Query: Mandatory Tags', () =>
      prisma.tag.findMany({
        where: { isMandatory: true, active: 1 },
        select: { code: true, name: true, dimension: true }
      })
    )

    // Fetch all transcripts
    const transcripts = await logger.time('Query: Transcripts', () =>
      prisma.transcript.findMany({
        select: { dealId: true, content: true }
      })
    )
    const transcriptMap = new Map(transcripts.map(t => [t.dealId, t.content]))

    // Fetch all signals
    const allSignals = await logger.time('Query: Signals', () =>
      prisma.callSignal.findMany({
        orderBy: { timestampSec: 'asc' }
      })
    )

    logger.info('Signals fetched', { count: allSignals.length })

    const signalsByCall: Record<string, typeof allSignals> = {}
    allSignals.forEach(s => {
      if (!signalsByCall[s.callId]) {
        signalsByCall[s.callId] = []
      }
      signalsByCall[s.callId].push(s)
    })

    // 3. Transform to CallRecord format
    const formatTimer = logger.startTimer('Compute: Format Calls')

    const formattedCalls = calls.map((call) => {
      const callAssessments = assessmentsByCall[call.id] || []
      const rawSignals = signalsByCall[call.id] || []

      // Helper to calculate average score for a dimension (Hybrid: Assessed + Missing Mandatory)
      const getAvgScore = (dims: string[]) => {
        // 1. Get Assessed Scores
        const assessed = callAssessments.filter(a =>
          a.tag.dimension && dims.some(d => a.tag.dimension === d || a.tag.dimension.startsWith(d + '.'))
        )

        let totalScore = assessed.reduce((sum, a) => sum + a.score, 0)
        let denominator = assessed.length

        // 2. Check Missing Mandatory Tags
        const relevantMandatoryTags = mandatoryTags.filter(t =>
          dims.some(d => t.dimension === d || t.dimension.startsWith(d + '.'))
        )

        for (const mTag of relevantMandatoryTags) {
          const isAssessed = callAssessments.some(a => a.tag.code === mTag.code)
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
      const tags = Array.from(new Set(callAssessments.map(a => a.tag.name)))

      // behaviors: filtered by specific criteria
      const behaviors = callAssessments
        .filter(a => a.tag.category === 'Sales' || a.tag.category === 'Communication')
        .map(a => a.tag.code)

      // service_issues
      const service_issues = callAssessments
        .filter(a => a.tag.category === 'Service Issue')
        .map(a => ({
          tag: a.tag.code,
          severity: a.tag.severity ? a.tag.severity.toLowerCase() : 'low'
        }))

      // Signals: Use Assessments + Missing Mandatory (Scored View)
      const assessmentSignals = callAssessments.map(a => {
        // Find all occurrences for this tag
        const instances = rawSignals
          .filter(r => r.signalCode === a.tag.code)
          .map(r => ({
            timestamp: r.timestampSec ? new Date(call.startedAt).getTime() + (r.timestampSec * 1000) : null,
            context: r.contextText,
            reasoning: r.reasoning,
            confidence: r.confidence
          }))

        // If no raw signals found, use assessment data
        if (instances.length === 0) {
          instances.push({
            timestamp: a.timestampSec ? new Date(call.startedAt).getTime() + (a.timestampSec * 1000) : null,
            context: a.contextText,
            reasoning: a.reasoning,
            confidence: a.confidence
          })
        }

        return {
          tag: a.tag.code,
          name: a.tag.name,
          dimension: a.tag.dimension,
          score: a.score,
          confidence: a.confidence,
          reasoning: a.reasoning,
          context: a.contextText,
          timestamp: a.timestampSec ? new Date(call.startedAt).getTime() + (a.timestampSec * 1000) : null,
          severity: a.tag.severity || 'none',
          polarity: a.tag.polarity ? a.tag.polarity.toLowerCase() : 'neutral',
          is_mandatory: false,
          occurrences: instances
        }
      })

      const missingSignals = mandatoryTags
        .filter(mTag => !callAssessments.some(a => a.tag.code === mTag.code))
        .map(mTag => ({
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
        }))

      const signals = [...assessmentSignals, ...missingSignals]

      // Parse Transcript
      let transcript: any[] = []
      try {
        const transcriptContent = transcriptMap.get(call.id)
        if (transcriptContent) {
          const parsed = JSON.parse(transcriptContent)
          const transcriptData = Array.isArray(parsed) ? parsed : []

          transcript = transcriptData.map((entry: any) => ({
            timestamp: Math.round((entry.BeginTime || 0) / 1000),
            speaker: (entry.SpeakerId === '1' || entry.SpeakerId === 1) ? 'agent' : 'customer',
            text: entry.Text || ''
          }))
        }
      } catch (e) {
        logger.warn(`Transcript parse error for call ${call.id}`)
      }

      return {
        id: call.id,
        agentId: call.agentId,
        agentName: call.agent.name,
        agentAvatarId: call.agent.avatarId,
        title: `Call with ${call.agent.name || 'Agent'}`,
        customer_name: 'Customer',
        timestamp: call.startedAt,
        duration_minutes: Math.round((call.duration || 0) / 60),
        processScore,
        skillsScore,
        communicationScore,
        overallQualityScore,
        business_grade: call.outcome === 'won' ? 'High' : (call.outcome === 'lost' ? 'Low' : 'Medium'),
        tags,
        events: behaviors,
        behaviors,
        service_issues,
        signals,
        transcript,
        audioUrl: call.audioUrl
      }
    })

    formatTimer.end({ callCount: formattedCalls.length })

    totalTimer.end({
      callCount: formattedCalls.length,
      assessmentCount: allAssessments.length,
      signalCount: allSignals.length
    })

    return NextResponse.json(formattedCalls)
  } catch (error) {
    logger.error('Request failed', { error: String(error) })
    totalTimer.end({ status: 'error' })
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
