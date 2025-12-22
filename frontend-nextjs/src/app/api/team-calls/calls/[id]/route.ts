import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'
import { getStorageUrl } from '@/lib/storage'
import { calculateIntent, type CallTagScore } from '@/lib/intent-calculator'

const logger = createLogger('Call Detail')

/**
 * GET /api/team-calls/calls/[id]
 * 
 * 获取单个通话的完整详情（按需加载）
 * 
 * 包含：
 *   - 基本信息和评分
 *   - 完整的 signals 和 tags
 *   - 完整的 transcript
 *   - rawSignals (LLM 原始事件)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const totalTimer = logger.startTimer('Total API Request')
    const { id: callId } = await params

    try {
        logger.info('Fetching call detail', { callId })

        // 1. Fetch the call with agent info
        const call = await logger.time('Query: Call', () =>
            prisma.call.findUnique({
                where: { id: callId },
                include: {
                    agent: {
                        select: { name: true, avatarId: true }
                    }
                }
            })
        )

        if (!call) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 })
        }

        // 1b. Fetch dynamic fields from sync_deals
        const deal = await logger.time('Query: Deal Info', () =>
            prisma.deal.findUnique({
                where: { id: callId },
                select: { outcome: true, isOnsiteCompleted: true }
            })
        )
        const outcome = deal?.outcome || 'unknown'
        const isOnsiteCompleted = deal?.isOnsiteCompleted ?? 0

        // 2. Get Score Config
        const scoreConfig = await logger.time('Query: Score Config', () => prisma.scoreConfig.findFirst())
        const weights = {
            process: scoreConfig?.processWeight || 30,
            skills: scoreConfig?.skillsWeight || 50,
            communication: scoreConfig?.communicationWeight || 20
        }

        // 3. Fetch tags for this call
        const callTags = await logger.time('Query: Tags', () =>
            prisma.callTag.findMany({
                where: { callId },
                include: {
                    tag: {
                        select: { name: true, code: true, dimension: true, category: true, severity: true, polarity: true }
                    }
                }
            })
        )

        // 4. Get Mandatory Tags
        const mandatoryTags = await logger.time('Query: Mandatory Tags', () =>
            prisma.tag.findMany({
                where: { isMandatory: true, active: 1 },
                select: { code: true, name: true, dimension: true }
            })
        )

        // 5. Fetch transcript
        const transcriptRecord = await logger.time('Query: Transcript', () =>
            prisma.transcript.findFirst({
                where: { dealId: callId },
                select: { content: true }
            })
        )

        // 6. Fetch raw signals with signal definitions
        const rawSignals = await logger.time('Query: Signals', () =>
            prisma.callSignal.findMany({
                where: { callId },
                include: {
                    signal: {
                        select: { code: true, name: true, category: true, dimension: true }
                    }
                },
                orderBy: { timestampSec: 'asc' }
            })
        )

        logger.info('Data fetched', {
            tags: callTags.length,
            signals: rawSignals.length
        })

        // 7. Calculate scores
        const getAvgScore = (dims: string[]) => {
            const assessed = callTags.filter(a =>
                a.tag.dimension && dims.some(d => a.tag.dimension === d || a.tag.dimension.startsWith(d + '.'))
            )

            let totalScore = assessed.reduce((sum, a) => sum + a.score, 0)
            let denominator = assessed.length

            const relevantMandatoryTags = mandatoryTags.filter(t =>
                dims.some(d => t.dimension === d || t.dimension.startsWith(d + '.'))
            )

            for (const mTag of relevantMandatoryTags) {
                const isAssessed = callTags.some(a => a.tag.code === mTag.code)
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

        // 8. Build signals array
        const tagSignals = callTags.map(a => {
            const instances = rawSignals
                .filter(r => r.signal?.code === a.tag.code)
                .map(r => ({
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
            .filter(mTag => !callTags.some(a => a.tag.code === mTag.code))
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

        const signals = [...tagSignals, ...missingSignals]

        // 9. Parse transcript
        let transcript: any[] = []
        try {
            if (transcriptRecord?.content) {
                const parsed = JSON.parse(transcriptRecord.content)
                const transcriptData = Array.isArray(parsed) ? parsed : []

                transcript = transcriptData.map((entry: any) => ({
                    timestamp: Math.round((entry.BeginTime || 0) / 1000),
                    speaker: (entry.SpeakerId === '1' || entry.SpeakerId === 1) ? 'agent' : 'customer',
                    text: entry.Text || ''
                }))
            }
        } catch (e) {
            logger.warn(`Transcript parse error for call ${callId}`)
        }

        // 10. Build behaviors and service issues
        const behaviors = callTags
            .filter(a => a.tag.category === 'Sales' || a.tag.category === 'Communication')
            .map(a => a.tag.code)

        const service_issues = callTags
            .filter(a => a.tag.category === 'Service Issue')
            .map(a => ({
                tag: a.tag.code,
                severity: a.tag.severity ? a.tag.severity.toLowerCase() : 'low'
            }))

        const tags = Array.from(new Set(callTags.map(a => a.tag.name)))

        // 11. Calculate Predicted Intent (AI-based)
        const intentTags: CallTagScore[] = callTags.map(a => ({
            tagId: a.tagId,
            tagCode: a.tag.code,
            tagName: a.tag.name,
            category: a.tag.category || undefined,
            dimension: a.tag.dimension || undefined,
            score: a.score
        }))
        const predictedIntent = calculateIntent(intentTags)

        // 12. Build response
        const result = {
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
            // Dual-track: Keep actual outcome AND add predicted intent
            outcome,  // 从 sync_deals 获取实际结果
            isOnsiteCompleted,  // 是否已上门 (1=已上门, 0=未上门)
            business_grade: outcome === 'won' ? 'High' : (outcome === 'lost' ? 'Low' : 'Medium'),
            predictedIntent,  // 意向研判
            tags,
            events: behaviors,
            behaviors,
            service_issues,
            signals,
            rawSignals: rawSignals.map(s => ({
                signalCode: s.signal?.code || s.signalId,
                signalName: s.signal?.name || s.signalId,
                timestampSec: s.timestampSec,
                contextText: s.contextText,
                reasoning: s.reasoning,
                confidence: s.confidence
            })),
            transcript,
            audioUrl: getStorageUrl(call.audioUrl)
        }

        totalTimer.end({ callId, signalCount: signals.length })

        return NextResponse.json(result)

    } catch (error) {
        logger.error('Request failed', { callId, error: String(error) })
        totalTimer.end({ status: 'error' })
        return NextResponse.json({ error: 'Failed to fetch call detail', details: String(error) }, { status: 500 })
    }
}
