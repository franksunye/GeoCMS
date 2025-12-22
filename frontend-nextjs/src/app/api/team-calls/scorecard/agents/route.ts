import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Scorecard/Agents')

export async function GET(request: NextRequest) {
  const totalTimer = logger.startTimer('Total API Request')

  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '7d'
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')
    const leakAreaCode = searchParams.get('leakArea') // 漏水部位一级分类编号，如 "1", "2" 等

    logger.info('Request received', { timeframe, customStartDate, customEndDate, leakAreaCode })

    let cutoffDate = new Date()
    let endDate: Date | null = null  // For custom range
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
    } else if (timeframe === 'custom' && customStartDate) {
      // 自定义日期范围
      cutoffDate = new Date(customStartDate)
      if (customEndDate) {
        endDate = new Date(customEndDate)
      }
    }

    const cutoffIso = cutoffDate.toISOString()
    const endIso = endDate ? endDate.toISOString() : null

    // 构建日期范围查询条件（Prisma where 对象）
    const callDateFilter = endIso
      ? { startedAt: { gte: cutoffIso, lte: endIso } }
      : { startedAt: { gte: cutoffIso } }

    // Deal 筛选：日期 + 可选的漏水部位
    // leak_area 存储的是 JSON 数组，如 ["2"] 或 ["2","201"]，一级分类是第一个元素
    const dealDateFilter = endIso
      ? { createdAt: { gte: cutoffIso, lte: endIso } }
      : { createdAt: { gte: cutoffIso } }

    // 如果指定了漏水部位，添加筛选条件
    // 因为 leak_area 是 JSON 格式，需要用 LIKE 匹配元素
    const leakAreaCodes = leakAreaCode ? leakAreaCode.split(',').filter(Boolean) : []
    const leakAreaFilter = leakAreaCodes.length > 0
      ? {
        OR: leakAreaCodes.map(code => ({
          leakArea: { contains: `"${code}"` }
        }))
      }
      : {}
    const dealFilterWithArea = { ...dealDateFilter, ...leakAreaFilter }

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

    // 4. Batch Query: Call Stats per Agent (通话分析数据)
    const agentCallStats = await logger.time('Query: Call Stats', () =>
      prisma.call.groupBy({
        by: ['agentId'],
        where: callDateFilter,
        _count: { id: true },
      })
    )

    const callStatsMap = new Map<string, number>()
    agentCallStats.forEach(s => {
      callStatsMap.set(s.agentId, s._count.id)
    })

    // 5. Query: Deal Stats from CRM (sync_deals) for Win Rate
    // 赢单率从 CRM 工单数据计算，而不是从通话分析结果
    // 现在支持按漏水部位筛选
    const agentDealStats = await logger.time('Query: Deal Stats (CRM)', () =>
      prisma.deal.groupBy({
        by: ['agentId'],
        where: dealFilterWithArea,
        _count: { id: true },
      })
    )

    const wonDealStats = await logger.time('Query: Won Deal Stats (CRM)', () =>
      prisma.deal.groupBy({
        by: ['agentId'],
        where: { ...dealFilterWithArea, outcome: 'won' },
        _count: { id: true },
      })
    )

    const dealStatsMap = new Map<string, { totalDeals: number; wonDeals: number; onsiteDeals: number }>()
    agentDealStats.forEach(s => {
      dealStatsMap.set(s.agentId, { totalDeals: s._count.id, wonDeals: 0, onsiteDeals: 0 })
    })
    wonDealStats.forEach(s => {
      const existing = dealStatsMap.get(s.agentId)
      if (existing) existing.wonDeals = s._count.id
    })

    // 5b. Query: Onsite Completed Stats from CRM (sync_deals) for Onsite Rate
    const onsiteDealStats = await logger.time('Query: Onsite Deal Stats (CRM)', () =>
      prisma.deal.groupBy({
        by: ['agentId'],
        where: { ...dealFilterWithArea, isOnsiteCompleted: 1 },
        _count: { id: true },
      })
    )
    onsiteDealStats.forEach(s => {
      const existing = dealStatsMap.get(s.agentId)
      if (existing) existing.onsiteDeals = s._count.id
    })

    // 6. Optimized: Use SQL aggregation for tag scores per agent
    // This replaces loading all 5000-10000 rows into memory
    interface AgentTagAvg {
      agentId: string
      tagId: string
      avgScore: number
    }

    const aggregatedScores = await logger.time('Query: Aggregated Tag Scores', async () => {
      if (endIso) {
        // 有结束日期的情况
        return prisma.$queryRaw<AgentTagAvg[]>`
          SELECT 
            c.agent_id as "agentId",
            ct.tag_id as "tagId", 
            ROUND(AVG(ct.score), 2) as "avgScore"
          FROM biz_call_tags ct
          INNER JOIN biz_calls c ON ct.call_id = c.id
          WHERE c.started_at >= ${cutoffIso} AND c.started_at <= ${endIso}
          GROUP BY c.agent_id, ct.tag_id
        `
      } else {
        // 只有开始日期的情况
        return prisma.$queryRaw<AgentTagAvg[]>`
          SELECT 
            c.agent_id as "agentId",
            ct.tag_id as "tagId", 
            ROUND(AVG(ct.score), 2) as "avgScore"
          FROM biz_call_tags ct
          INNER JOIN biz_calls c ON ct.call_id = c.id
          WHERE c.started_at >= ${cutoffIso}
          GROUP BY c.agent_id, ct.tag_id
        `
      }
    })

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

    // 7. Process each agent
    const formatTimer = logger.startTimer('Compute: Format Agents')

    const formattedAgents = agents.map((agent) => {
      // A. Get Call Stats (通话分析数据)
      const recordings = callStatsMap.get(agent.id) || 0

      // B. Get Win Rate and Onsite Rate from CRM Deal Stats (CRM工单数据)
      const dealStats = dealStatsMap.get(agent.id) || { totalDeals: 0, wonDeals: 0, onsiteDeals: 0 }
      const winRate = dealStats.totalDeals > 0 ? Math.round((dealStats.wonDeals / dealStats.totalDeals) * 100) : 0
      const onsiteRate = dealStats.totalDeals > 0 ? Math.round((dealStats.onsiteDeals / dealStats.totalDeals) * 100) : 0

      // C. Get Tag Scores from Map
      const agentScores = agentTagAvgMap.get(agent.id) || new Map()

      // D. Helper to build details array ensuring consistent order/length
      const buildDetails = (refTags: typeof allTags) => {
        return refTags.map(tag => ({
          name: tag.name,
          tagId: tag.code, // Include tag code as ID for deep linking
          is_mandatory: Boolean(tag.isMandatory),
          score: Math.round(agentScores.get(tag.code) || 0)
        }))
      }

      const processDetails = buildDetails(processRefTags)
      const skillsDetails = buildDetails(skillsRefTags)
      const communicationDetails = buildDetails(commRefTags)

      // E. Calculate Dimension Scores (Hybrid: Assessed OR Mandatory)
      const calculateAverage = (refTags: typeof allTags) => {
        let totalScore = 0
        let denominator = 0

        for (const tag of refTags) {
          const score = agentScores.get(tag.code)
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

      // F. Calculate Overall Score
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
        totalDeals: dealStats.totalDeals,
        wonDeals: dealStats.wonDeals,
        onsiteDeals: dealStats.onsiteDeals,
        winRate,
        onsiteRate,  // 上门率 (已上门工单数 / 总工单数 * 100)
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
