import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'
import { getStorageUrl } from '@/lib/storage'

const logger = createLogger('Calls')

/**
 * GET /api/team-calls/calls
 * 
 * 获取通话列表（支持分页）
 * 
 * Query Parameters:
 *   - page: 页码 (默认 1)
 *   - pageSize: 每页数量 (默认 20, 最大 100)
 *   - agentId: 按坐席过滤
 *   - startDate: 开始日期过滤 (ISO string)
 *   - endDate: 结束日期过滤 (ISO string)
 *   - includeDetails: 是否包含详情数据 (默认 false, 用于向后兼容)
 * 
 * Response:
 *   - data: CallRecord[]
 *   - pagination: { page, pageSize, total, totalPages }
 */
export async function GET(request: NextRequest) {
  const totalTimer = logger.startTimer('Total API Request')

  try {
    const { searchParams } = new URL(request.url)

    // Parse pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
    const skip = (page - 1) * pageSize

    // Parse filter params
    const agentId = searchParams.get('agentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Backward compatibility: if includeDetails=true, load full data (for migration period)
    const includeDetails = searchParams.get('includeDetails') === 'true'

    logger.info('Request received', { page, pageSize, agentId, startDate, endDate, includeDetails })

    // Build where clause
    const where: any = {}
    if (agentId) {
      where.agentId = agentId
    }
    if (startDate || endDate) {
      where.startedAt = {}
      if (startDate) where.startedAt.gte = startDate
      if (endDate) where.startedAt.lte = endDate
    }

    // 1. Get total count for pagination
    const total = await logger.time('Query: Count', () =>
      prisma.call.count({ where })
    )

    // 2. Fetch paginated calls with agent info
    const calls = await logger.time('Query: Calls with Agents', () =>
      prisma.call.findMany({
        where,
        include: {
          agent: {
            select: { name: true, avatarId: true }
          }
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: pageSize
      })
    )

    logger.info('Calls fetched', { count: calls.length, total })

    // 3. Get Score Config (for weights)
    const scoreConfig = await logger.time('Query: Score Config', () => prisma.scoreConfig.findFirst())
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

    // 4. Get callIds for this page
    const callIds = calls.map(c => c.id)

    // 5. Fetch assessments ONLY for this page's calls
    const pageAssessments = await logger.time('Query: Page Assessments', () =>
      prisma.callAssessment.findMany({
        where: { callId: { in: callIds } },
        include: {
          tag: {
            select: { name: true, code: true, dimension: true, category: true, severity: true, polarity: true }
          }
        }
      })
    )

    logger.info('Assessments fetched', { count: pageAssessments.length })

    // Group assessments by callId
    const assessmentsByCall: Record<string, typeof pageAssessments> = {}
    pageAssessments.forEach(a => {
      if (!assessmentsByCall[a.callId]) {
        assessmentsByCall[a.callId] = []
      }
      assessmentsByCall[a.callId].push(a)
    })

    // 6. Get Mandatory Tags (cached, small set)
    const mandatoryTags = await logger.time('Query: Mandatory Tags', () =>
      prisma.tag.findMany({
        where: { isMandatory: true, active: 1 },
        select: { code: true, name: true, dimension: true }
      })
    )

    // 7. Conditionally load heavy data for backward compatibility
    let transcriptMap = new Map<string, string>()
    let signalsByCall: Record<string, any[]> = {}

    if (includeDetails) {
      // Load transcripts for this page
      const transcripts = await logger.time('Query: Transcripts', () =>
        prisma.transcript.findMany({
          where: { dealId: { in: callIds } },
          select: { dealId: true, content: true }
        })
      )
      transcriptMap = new Map(transcripts.map(t => [t.dealId, t.content]))

      // Load signals for this page
      const pageSignals = await logger.time('Query: Signals', () =>
        prisma.callSignal.findMany({
          where: { callId: { in: callIds } },
          orderBy: { timestampSec: 'asc' }
        })
      )
      pageSignals.forEach(s => {
        if (!signalsByCall[s.callId]) {
          signalsByCall[s.callId] = []
        }
        signalsByCall[s.callId].push(s)
      })
    }

    // 8. Transform to CallRecord format
    const formatTimer = logger.startTimer('Compute: Format Calls')

    const formattedCalls = calls.map((call) => {
      const callAssessments = assessmentsByCall[call.id] || []
      const rawSignals = signalsByCall[call.id] || []

      // Helper to calculate average score for a dimension
      const getAvgScore = (dims: string[]) => {
        const assessed = callAssessments.filter(a =>
          a.tag.dimension && dims.some(d => a.tag.dimension === d || a.tag.dimension.startsWith(d + '.'))
        )

        let totalScore = assessed.reduce((sum, a) => sum + a.score, 0)
        let denominator = assessed.length

        const relevantMandatoryTags = mandatoryTags.filter(t =>
          dims.some(d => t.dimension === d || t.dimension.startsWith(d + '.'))
        )

        for (const mTag of relevantMandatoryTags) {
          const isAssessed = callAssessments.some(a => a.tag.code === mTag.code)
          if (!isAssessed) {
            denominator++
          }
        }

        if (denominator === 0) return 0
        return Math.round(totalScore / denominator)
      }

      const processScore = getAvgScore(['Sales.Process', 'Process'])
      const skillsScore = getAvgScore(['Sales.Skills', 'Skills'])
      const communicationScore = getAvgScore(['Sales.Communication', 'Communication'])

      const overallQualityScore = Math.round(
        (processScore * weights.process +
          skillsScore * weights.skills +
          communicationScore * weights.communication) / 100
      )

      const tags = Array.from(new Set(callAssessments.map(a => a.tag.name)))

      // Base record (lightweight)
      const baseRecord = {
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
        audioUrl: getStorageUrl(call.audioUrl)
      }

      // If includeDetails, add full data (backward compatibility)
      if (includeDetails) {
        const behaviors = callAssessments
          .filter(a => a.tag.category === 'Sales' || a.tag.category === 'Communication')
          .map(a => a.tag.code)

        const service_issues = callAssessments
          .filter(a => a.tag.category === 'Service Issue')
          .map(a => ({
            tag: a.tag.code,
            severity: a.tag.severity ? a.tag.severity.toLowerCase() : 'low'
          }))

        const assessmentSignals = callAssessments.map(a => {
          const instances = rawSignals
            .filter((r: any) => r.signalCode === a.tag.code)
            .map((r: any) => ({
              timestamp: r.timestampSec ? new Date(call.startedAt).getTime() + (r.timestampSec * 1000) : null,
              context: r.contextText,
              reasoning: r.reasoning,
              confidence: r.confidence
            }))

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
            category: a.tag.category,
            dimension: a.tag.dimension,
            score: a.score,
            confidence: a.confidence,
            reasoning: a.reasoning,
            context: a.contextText,
            timestamp: a.timestampSec ? new Date(call.startedAt).getTime() + (a.timestampSec * 1000) : null,
            severity: a.tag.severity || 'none',
            polarity: a.tag.polarity ? a.tag.polarity.toLowerCase() : 'neutral',
            is_mandatory: false,
            occurrences: instances,
            contextEvents: a.contextEvents
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
          ...baseRecord,
          events: behaviors,
          behaviors,
          service_issues,
          signals,
          rawSignals: rawSignals.map((s: any) => ({
            signalCode: s.signalCode,
            signalName: s.signalCode, // Will be resolved in detail API
            timestampSec: s.timestampSec,
            contextText: s.contextText,
            reasoning: s.reasoning,
            confidence: s.confidence
          })),
          transcript
        }
      }

      return baseRecord
    })

    formatTimer.end({ callCount: formattedCalls.length })

    const totalPages = Math.ceil(total / pageSize)

    totalTimer.end({
      callCount: formattedCalls.length,
      page,
      pageSize,
      total,
      totalPages
    })

    // Return paginated response
    return NextResponse.json({
      data: formattedCalls,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    })

  } catch (error) {
    logger.error('Request failed', { error: String(error) })
    totalTimer.end({ status: 'error' })
    return NextResponse.json({ error: 'Failed to fetch calls', details: String(error) }, { status: 500 })
  }
}
