import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Scorecard/Validation')

interface AgentStats {
  id: string
  overallScore: number
  totalCalls: number
  wonCalls: number
  winRate: number
}

export async function GET(request: NextRequest) {
  const totalTimer = logger.startTimer('Total API Request')

  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '3m'
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')

    logger.info('Request received', { timeframe, customStartDate, customEndDate })

    let cutoffDate = new Date()
    let endDate: Date | null = null
    cutoffDate.setHours(0, 0, 0, 0)

    // Custom date range has highest priority
    if (customStartDate) {
      cutoffDate = new Date(customStartDate)
      cutoffDate.setHours(0, 0, 0, 0)

      if (customEndDate) {
        endDate = new Date(customEndDate)
        endDate.setHours(23, 59, 59, 999)
      }
    } else if (timeframe === '3m') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 3)
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30)
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7)
    } else if (timeframe === 'all') {
      cutoffDate = new Date(0) // Epoch
    }

    const cutoffIso = cutoffDate.toISOString()
    const endIso = endDate ? endDate.toISOString() : new Date().toISOString()

    // 1. Get agent stats with call counts
    const dateFilter = { gte: cutoffIso, lte: endIso }

    const agentCallStats = await logger.time('Query: Call Stats', () =>
      prisma.call.groupBy({
        by: ['agentId'],
        where: { startedAt: dateFilter },
        _count: { id: true },
      })
    )

    const wonCallStats = await logger.time('Query: Won Call Stats', () =>
      prisma.call.groupBy({
        by: ['agentId'],
        where: { startedAt: dateFilter, outcome: 'won' },
        _count: { id: true },
      })
    )

    // Get agent details
    const agentIds = agentCallStats.filter(s => s._count.id >= 1).map(s => s.agentId)
    const agentsData = await prisma.agent.findMany({
      where: { id: { in: agentIds } }
    })

    const agentMap = new Map(agentsData.map(a => [a.id, a]))
    const wonMap = new Map(wonCallStats.map(s => [s.agentId, s._count.id]))

    const agents = agentCallStats
      .filter(s => s._count.id >= 1)
      .map(s => ({
        id: s.agentId,
        teamId: agentMap.get(s.agentId)?.teamId,
        avatarId: agentMap.get(s.agentId)?.avatarId,
        name: agentMap.get(s.agentId)?.name,
        totalCalls: s._count.id,
        wonCalls: wonMap.get(s.agentId) || 0,
        winRate: Math.round(((wonMap.get(s.agentId) || 0) / s._count.id) * 100 * 100) / 100
      }))

    // 2. Get score config and tags
    const scoreConfig = await logger.time('Query: Score Config', () => prisma.scoreConfig.findFirst())
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

    const allTags = await logger.time('Query: Tags', () =>
      prisma.tag.findMany({
        where: { active: 1, category: 'Sales' },
        orderBy: { name: 'asc' }
      })
    )
    const processRefTags = allTags.filter(t => t.dimension === 'Process' || t.dimension === 'Sales.Process')
    const skillsRefTags = allTags.filter(t => t.dimension === 'Skills' || t.dimension === 'Sales.Skills')
    const commRefTags = allTags.filter(t => t.dimension === 'Communication' || t.dimension === 'Sales.Communication')

    // 3. Get all tag scores
    const allTagScores = await logger.time('Query: All Tag Scores', () =>
      prisma.callTag.findMany({
        where: {
          call: { startedAt: dateFilter }
        },
        select: {
          tagId: true,
          score: true,
          call: { select: { agentId: true } }
        }
      }),
      { timeframe }
    )

    logger.info('Tag Scores fetched', { count: allTagScores.length })

    // Group by agentId and calculate averages
    const agentScoresMap = new Map<string, Map<string, number[]>>()
    allTagScores.forEach(row => {
      const agentId = row.call.agentId
      if (!agentScoresMap.has(agentId)) {
        agentScoresMap.set(agentId, new Map())
      }
      if (!agentScoresMap.get(agentId)!.has(row.tagId)) {
        agentScoresMap.get(agentId)!.set(row.tagId, [])
      }
      agentScoresMap.get(agentId)!.get(row.tagId)!.push(row.score)
    })

    const agentAvgMap = new Map<string, Map<string, number>>()
    agentScoresMap.forEach((tagMap, agentId) => {
      const avgMap = new Map<string, number>()
      tagMap.forEach((scores, tagId) => {
        avgMap.set(tagId, scores.reduce((a, b) => a + b, 0) / scores.length)
      })
      agentAvgMap.set(agentId, avgMap)
    })

    // 2b. Get Scoring Rules for Weights
    const scoringRules = await prisma.scoringRule.findMany({
      where: { active: 1, ruleType: 'TagBased' }
    })
    const tagWeightMap = new Map<string, number>()
    scoringRules.forEach(rule => {
      tagWeightMap.set(rule.tagCode, rule.weight)
    })

    // Calculate agent stats
    const agentStats: AgentStats[] = agents.map(agent => {
      const scoreMap = agentAvgMap.get(agent.id) || new Map()

      const calculateAverage = (refTags: typeof allTags) => {
        let weightedScoreSum = 0
        let weightSum = 0

        for (const tag of refTags) {
          const score = scoreMap.get(tag.code)
          // Default weight is 1.0 if not configured
          const weight = tagWeightMap.get(tag.code) || 1.0

          if (score !== undefined && score !== null) {
            weightedScoreSum += score * weight
            weightSum += weight
          } else if (tag.isMandatory) {
            // Missing mandatory tag counts as 0 score with its weight
            weightSum += weight
          }
        }
        return weightSum > 0 ? Math.round(weightedScoreSum / weightSum) : 0
      }

      const processScore = calculateAverage(processRefTags)
      const skillsScore = calculateAverage(skillsRefTags)
      const commScore = calculateAverage(commRefTags)

      const overallScore = Math.round(
        (processScore * weights.process +
          skillsScore * weights.skills +
          commScore * weights.communication) / 100
      )

      return {
        id: agent.id,
        overallScore,
        totalCalls: agent.totalCalls,
        wonCalls: agent.wonCalls,
        winRate: agent.winRate
      }
    })

    // 4. Calculate Correlation
    const calculateCorrelation = (stats: AgentStats[]): number => {
      const n = stats.length
      if (n < 2) return 0

      const sumXY = stats.reduce((sum, a) => sum + a.overallScore * a.winRate, 0)
      const sumX = stats.reduce((sum, a) => sum + a.overallScore, 0)
      const sumY = stats.reduce((sum, a) => sum + a.winRate, 0)
      const sumX2 = stats.reduce((sum, a) => sum + a.overallScore ** 2, 0)
      const sumY2 = stats.reduce((sum, a) => sum + a.winRate ** 2, 0)

      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))

      return denominator !== 0 ? numerator / denominator : 0
    }

    const correlation = calculateCorrelation(agentStats)

    // 5. Quartile Analysis
    const analyzeByScoreQuantiles = (stats: AgentStats[]) => {
      const sorted = [...stats].sort((a, b) => a.overallScore - b.overallScore)
      const quartileSize = Math.ceil(sorted.length / 4)

      const calculateGroupStats = (group: AgentStats[], range: string) => ({
        range,
        avgScore: group.length > 0 ? Math.round(group.reduce((sum, a) => sum + a.overallScore, 0) / group.length) : 0,
        avgWinRate: group.length > 0 ? Math.round(group.reduce((sum, a) => sum + a.winRate, 0) / group.length) : 0,
        sampleSize: group.length
      })

      if (sorted.length === 0) {
        return {
          q1: calculateGroupStats([], "Bottom 25%"),
          q2: calculateGroupStats([], "25-50%"),
          q3: calculateGroupStats([], "50-75%"),
          q4: calculateGroupStats([], "Top 25%")
        }
      }

      return {
        q1: calculateGroupStats(sorted.slice(0, quartileSize), "Bottom 25%"),
        q2: calculateGroupStats(sorted.slice(quartileSize, quartileSize * 2), "25-50%"),
        q3: calculateGroupStats(sorted.slice(quartileSize * 2, quartileSize * 3), "50-75%"),
        q4: calculateGroupStats(sorted.slice(quartileSize * 3), "Top 25%")
      }
    }

    const quartileAnalysis = analyzeByScoreQuantiles(agentStats)

    // 6. Business Thresholds
    const validateBusinessThresholds = (stats: AgentStats[]) => {
      const thresholds = [
        { minScore: 80, expectedWinRate: 70, description: "优秀表现阈值" },
        { minScore: 60, expectedWinRate: 50, description: "合格表现阈值" },
        { minScore: 0, expectedWinRate: 30, description: "需要改进阈值" }
      ]

      return thresholds.map(threshold => {
        const agentsInRange = stats.filter(a => a.overallScore >= threshold.minScore)
        const actualWinRate = agentsInRange.length > 0 ?
          agentsInRange.reduce((sum, a) => sum + a.winRate, 0) / agentsInRange.length : 0

        return {
          ...threshold,
          actualWinRate: Math.round(actualWinRate),
          sampleSize: agentsInRange.length,
          meetsExpectation: actualWinRate >= threshold.expectedWinRate
        }
      })
    }

    const businessThresholds = validateBusinessThresholds(agentStats)

    // 7. Trend Analysis (Monthly)
    const allCalls = await prisma.call.findMany({
      where: { startedAt: dateFilter },
      select: {
        id: true,
        startedAt: true,
        outcome: true,
        tags: {
          select: {
            score: true,
            tag: { select: { dimension: true } }
          }
        }
      }
    })

    const monthlyStats = new Map<string, { totalScore: number; count: number; wonCount: number }>()

    allCalls.forEach(call => {
      // Group tags by dimension
      const dimScores: Record<string, number[]> = {}
      call.tags.forEach(t => {
        const dim = t.tag.dimension
        if (!dimScores[dim]) dimScores[dim] = []
        dimScores[dim].push(t.score)
      })

      // Calculate averages per dimension
      const processScore = dimScores['Sales.Process']?.length
        ? dimScores['Sales.Process'].reduce((a, b) => a + b, 0) / dimScores['Sales.Process'].length
        : dimScores['Process']?.length
          ? dimScores['Process'].reduce((a, b) => a + b, 0) / dimScores['Process'].length
          : 0
      const skillsScore = dimScores['Sales.Skills']?.length
        ? dimScores['Sales.Skills'].reduce((a, b) => a + b, 0) / dimScores['Sales.Skills'].length
        : dimScores['Skills']?.length
          ? dimScores['Skills'].reduce((a, b) => a + b, 0) / dimScores['Skills'].length
          : 0
      const commScore = dimScores['Sales.Communication']?.length
        ? dimScores['Sales.Communication'].reduce((a, b) => a + b, 0) / dimScores['Sales.Communication'].length
        : dimScores['Communication']?.length
          ? dimScores['Communication'].reduce((a, b) => a + b, 0) / dimScores['Communication'].length
          : 0

      const overallScore = (
        processScore * weights.process +
        skillsScore * weights.skills +
        commScore * weights.communication
      ) / 100

      const date = new Date(call.startedAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { totalScore: 0, count: 0, wonCount: 0 })
      }
      const stats = monthlyStats.get(month)!
      stats.totalScore += overallScore
      stats.count += 1
      if (call.outcome === 'won') {
        stats.wonCount += 1
      }
    })

    const trendAnalysis = Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({
        month,
        avgScore: Math.round(stats.totalScore / stats.count),
        winRate: Math.round((stats.wonCount / stats.count) * 100),
        sampleSize: stats.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const validationResult = {
      correlation,
      sampleSize: agents.length,
      quartileAnalysis,
      businessThresholds,
      trendAnalysis,
      summary: {
        isValid: correlation > 0.3,
        message: correlation > 0.3
          ? "评分系统与转化率呈现显著正相关，验证通过"
          : "评分系统与转化率相关性不足，需要优化"
      }
    }

    totalTimer.end({
      agentCount: agents.length,
      correlation: correlation.toFixed(3)
    })

    logger.info('Validation complete', {
      correlation: correlation.toFixed(3),
      isValid: correlation > 0.3
    })

    return NextResponse.json(validationResult)

  } catch (error) {
    logger.error('Validation failed', { error: String(error) })
    totalTimer.end({ status: 'error' })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: '验证失败', message: errorMessage },
      { status: 500 }
    )
  }
}
