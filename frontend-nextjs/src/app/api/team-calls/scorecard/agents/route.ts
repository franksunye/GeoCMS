import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Scorecard/Agents')

export async function GET(request: NextRequest) {
  const totalTimer = logger.startTimer('Total API Request')

  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '7d'

    logger.info('Request received', { timeframe })

    let cutoffDate = new Date()
    cutoffDate.setHours(0, 0, 0, 0)

    if (timeframe === '3m') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 3)
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30)
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7)
    } else if (timeframe === 'yesterday') {
      cutoffDate.setDate(cutoffDate.getDate() - 1)
    } else if (timeframe === 'all') {
      cutoffDate = new Date(0) // Epoch
    } else if (timeframe === 'custom') {
      cutoffDate.setDate(cutoffDate.getDate() - 7)
    }

    const cutoffIso = cutoffDate.toISOString()

    // 1. Get Agents
    const agents = await logger.time('Query: Agents', () => prisma.agent.findMany())

    // 2. Get Score Config (for weights)
    const scoreConfig = await logger.time('Query: Score Config', () => prisma.scoreConfig.findFirst())
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

    // 3. Get All Active Tags (to ensure consistent structure)
    const allTags = await logger.time('Query: Tags', () =>
      prisma.tag.findMany({
        where: { active: 1, category: 'Sales' },
        orderBy: { name: 'asc' }
      })
    )
    const processRefTags = allTags.filter(t => t.dimension === 'Process' || t.dimension === 'Sales.Process')
    const skillsRefTags = allTags.filter(t => t.dimension === 'Skills' || t.dimension === 'Sales.Skills')
    const commRefTags = allTags.filter(t => t.dimension === 'Communication' || t.dimension === 'Sales.Communication')

    // 4. Batch Query: Call Stats per Agent
    const agentCallStats = await logger.time('Query: Call Stats', () =>
      prisma.call.groupBy({
        by: ['agentId'],
        where: { startedAt: { gte: cutoffIso } },
        _count: { id: true },
      })
    )

    // Get won calls separately
    const wonCallStats = await logger.time('Query: Won Call Stats', () =>
      prisma.call.groupBy({
        by: ['agentId'],
        where: { startedAt: { gte: cutoffIso }, outcome: 'won' },
        _count: { id: true },
      })
    )

    const statsMap = new Map<string, { totalCalls: number; wonCalls: number }>()
    agentCallStats.forEach(s => {
      statsMap.set(s.agentId, { totalCalls: s._count.id, wonCalls: 0 })
    })
    wonCallStats.forEach(s => {
      const existing = statsMap.get(s.agentId)
      if (existing) existing.wonCalls = s._count.id
    })

    // 5. Optimized: Use SQL aggregation for tag scores per agent
    // This replaces loading all 5000-10000 rows into memory
    interface AgentTagAvg {
      agentId: string
      tagId: string
      avgScore: number
    }

    const aggregatedScores = await logger.time('Query: Aggregated Tag Scores', () =>
      prisma.$queryRaw<AgentTagAvg[]>`
        SELECT 
          c.agent_id as "agentId",
          ct.tag_id as "tagId", 
          ROUND(AVG(ct.score), 2) as "avgScore"
        FROM biz_call_tags ct
        INNER JOIN biz_calls c ON ct.call_id = c.id
        WHERE c.started_at >= ${cutoffIso}
        GROUP BY c.agent_id, ct.tag_id
      `
    )

    logger.info('Aggregated Tag Scores fetched', {
      count: aggregatedScores.length,
      note: 'Using SQL GROUP BY instead of memory aggregation'
    })

    // Build Map: AgentId -> TagId -> AvgScore (already aggregated!)
    const computeTimer = logger.startTimer('Compute: Build Score Map')

    const agentTagAvgMap = new Map<string, Map<string, number>>()
    aggregatedScores.forEach((row) => {
      if (!agentTagAvgMap.has(row.agentId)) {
        agentTagAvgMap.set(row.agentId, new Map())
      }
      agentTagAvgMap.get(row.agentId)!.set(row.tagId, Number(row.avgScore))
    })

    computeTimer.end({ agentCount: agentTagAvgMap.size })

    // 6. Process each agent
    const formatTimer = logger.startTimer('Compute: Format Agents')

    const formattedAgents = agents.map((agent) => {
      // A. Get Call Stats from Map
      const stats = statsMap.get(agent.id) || { totalCalls: 0, wonCalls: 0 }
      const recordings = stats.totalCalls
      const winRate = recordings > 0 ? Math.round((stats.wonCalls / recordings) * 100) : 0

      // B. Get Tag Scores from Map
      const agentScores = agentTagAvgMap.get(agent.id) || new Map()

      // C. Helper to build details array ensuring consistent order/length
      const buildDetails = (refTags: typeof allTags) => {
        return refTags.map(tag => ({
          name: tag.name,
          tagId: tag.id, // Include TagId for deep linking
          is_mandatory: Boolean(tag.isMandatory),
          score: Math.round(agentScores.get(tag.id) || 0)
        }))
      }

      const processDetails = buildDetails(processRefTags)
      const skillsDetails = buildDetails(skillsRefTags)
      const communicationDetails = buildDetails(commRefTags)

      // D. Calculate Dimension Scores (Hybrid: Assessed OR Mandatory)
      const calculateAverage = (refTags: typeof allTags) => {
        let totalScore = 0
        let denominator = 0

        for (const tag of refTags) {
          const score = agentScores.get(tag.id)
          if (score !== undefined && score !== null) {
            // Case 1: Assessed (Triggered)
            totalScore += score
            denominator++
          } else if (tag.isMandatory) {
            // Case 2: Unassessed but Mandatory -> Count as 0 score
            denominator++
          }
          // Case 3: Unassessed and Optional -> Ignore
        }

        return denominator > 0 ? Math.round(totalScore / denominator) : 0
      }

      const processScore = calculateAverage(processRefTags)
      const skillsScore = calculateAverage(skillsRefTags)
      const commScore = calculateAverage(commRefTags)

      // E. Calculate Overall Score
      const overallScore = Math.round(
        (processScore * weights.process +
          skillsScore * weights.skills +
          commScore * weights.communication) / 100
      )

      return {
        id: agent.id,
        teamId: agent.teamId,
        avatarId: agent.avatarId,
        name: agent.name,
        overallScore,
        recordings,
        winRate,
        process: processScore,
        skills: skillsScore,
        communication: commScore,
        processDetails,
        skillsDetails,
        communicationDetails
      }
    })

    // Sort by Overall Score Descending
    formattedAgents.sort((a, b) => b.overallScore - a.overallScore)

    formatTimer.end({ agentCount: formattedAgents.length })

    const totalDuration = totalTimer.end({
      agentCount: formattedAgents.length,
      tagScoreCount: aggregatedScores.length
    })

    logger.info('Response ready', {
      totalDuration,
      agentCount: formattedAgents.length
    })

    return NextResponse.json(formattedAgents)
  } catch (error) {
    logger.error('Request failed', { error: String(error) })
    totalTimer.end({ status: 'error' })
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}
