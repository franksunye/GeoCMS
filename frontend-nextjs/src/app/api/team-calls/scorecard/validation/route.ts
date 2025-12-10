import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

interface AgentStats {
  id: string
  overallScore: number
  totalCalls: number
  wonCalls: number
  winRate: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '3m'

    let cutoffDate = new Date()
    // Reset time to start of day for consistency
    cutoffDate.setHours(0, 0, 0, 0)

    if (timeframe === '3m') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 3)
    } else if (timeframe === '30d') {
      cutoffDate.setDate(cutoffDate.getDate() - 30)
    } else if (timeframe === '7d') {
      cutoffDate.setDate(cutoffDate.getDate() - 7)
    } else if (timeframe === 'all') {
      cutoffDate = new Date(0) // Epoch
    }

    const cutoffIso = cutoffDate.toISOString()

    // 1. 获取agent基本数据和通话统计 (Filtered by timeframe)
    const agents = db.prepare(`
      SELECT 
        a.id,
        a.teamId,
        a.avatarId,
        a.name,
        COUNT(c.id) as totalCalls,
        SUM(CASE WHEN c.outcome = 'won' THEN 1 ELSE 0 END) as wonCalls,
        CASE 
          WHEN COUNT(c.id) > 0 THEN 
            ROUND(SUM(CASE WHEN c.outcome = 'won' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id), 2)
          ELSE 0 
        END as winRate
      FROM agents a
      LEFT JOIN calls c ON c.agentId = a.id
      WHERE c.startedAt >= ?
      GROUP BY a.id
      HAVING totalCalls >= 1
    `).all(cutoffIso) as any[]

    // 2. 获取评分配置和标签数据
    const scoreConfig = db.prepare('SELECT * FROM score_config LIMIT 1').get() as any
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

    const allTags = db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name ASC').all() as any[]
    const processRefTags = allTags.filter(t => t.dimension === 'Sales.Process')
    const skillsRefTags = allTags.filter(t => t.dimension === 'Sales.Skills')
    const commRefTags = allTags.filter(t => t.dimension === 'Sales.Communication')

    // 3. OPTIMIZED: 为每个agent计算分数 (Batch Fetch)
    // Fetch all tag scores for all agents in one query instead of N queries
    const allAgentTagScores = db.prepare(`
      SELECT 
        c.agentId,
        t.id as tagId,
        AVG(ca.score) as score
      FROM call_assessments ca 
      JOIN calls c ON c.id = ca.callId 
      JOIN tags t ON t.id = ca.tagId 
      WHERE c.startedAt >= ?
      GROUP BY c.agentId, t.id
    `).all(cutoffIso) as any[]

    // Group by agentId for O(1) access
    const agentScoresMap = new Map<string, Map<string, number>>()
    allAgentTagScores.forEach(row => {
        if (!agentScoresMap.has(row.agentId)) {
            agentScoresMap.set(row.agentId, new Map())
        }
        agentScoresMap.get(row.agentId)!.set(row.tagId, row.score)
    })

    const agentStats = agents.map(agent => {
      const scoreMap = agentScoresMap.get(agent.id) || new Map()

      const buildDetails = (refTags: any[]) => {
        return refTags.map(tag => ({
          name: tag.name,
          score: Math.round(scoreMap.get(tag.id) || 0)
        }))
      }

      const processDetails = buildDetails(processRefTags)
      const skillsDetails = buildDetails(skillsRefTags)
      const communicationDetails = buildDetails(commRefTags)

      const calculateAverage = (details: any[]) => 
        details.length > 0 
          ? Math.round(details.reduce((acc, item) => acc + item.score, 0) / details.length) 
          : 0

      const processScore = calculateAverage(processDetails)
      const skillsScore = calculateAverage(skillsDetails)
      const commScore = calculateAverage(communicationDetails)

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
    const calculateCorrelation = (agentStats: AgentStats[]): number => {
      const n = agentStats.length
      if (n < 2) return 0
      
      const sumXY = agentStats.reduce((sum, a) => sum + a.overallScore * a.winRate, 0)
      const sumX = agentStats.reduce((sum, a) => sum + a.overallScore, 0)
      const sumY = agentStats.reduce((sum, a) => sum + a.winRate, 0)
      const sumX2 = agentStats.reduce((sum, a) => sum + a.overallScore ** 2, 0)
      const sumY2 = agentStats.reduce((sum, a) => sum + a.winRate ** 2, 0)
      
      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))
      
      return denominator !== 0 ? numerator / denominator : 0
    }

    const correlation = calculateCorrelation(agentStats)

    // 5. Quartile Analysis
    const analyzeByScoreQuantiles = (agentStats: AgentStats[]) => {
      const sorted = [...agentStats].sort((a, b) => a.overallScore - b.overallScore)
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
    const validateBusinessThresholds = (agentStats: AgentStats[]) => {
      const thresholds = [
        { minScore: 80, expectedWinRate: 70, description: "优秀表现阈值" },
        { minScore: 60, expectedWinRate: 50, description: "合格表现阈值" },
        { minScore: 0, expectedWinRate: 30, description: "需要改进阈值" }
      ]
      
      return thresholds.map(threshold => {
        const agentsInRange = agentStats.filter(a => a.overallScore >= threshold.minScore)
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

    // 7. OPTIMIZED: Trend Analysis (Monthly)
    // Fetch aggregated dimension scores per call instead of all assessments
    const callDimensionScores = db.prepare(`
        SELECT 
            c.id as callId,
            c.startedAt,
            c.outcome,
            t.dimension,
            AVG(ca.score) as dimScore
        FROM call_assessments ca
        JOIN calls c ON c.id = ca.callId
        JOIN tags t ON t.id = ca.tagId
        WHERE c.startedAt >= ?
        GROUP BY c.id, t.dimension
        ORDER BY c.startedAt ASC
    `).all(cutoffIso) as any[]

    const monthlyStats = new Map<string, { totalScore: number; count: number; wonCount: number }>()
    
    // Group by callId locally
    const callMap = new Map<string, { startedAt: string, outcome: string, dims: Record<string, number> }>()
    
    callDimensionScores.forEach(row => {
        if (!callMap.has(row.callId)) {
            callMap.set(row.callId, { startedAt: row.startedAt, outcome: row.outcome, dims: {} })
        }
        callMap.get(row.callId)!.dims[row.dimension] = row.dimScore
    })

    callMap.forEach((call, callId) => {
        // Calculate overall score based on weights
        const processScore = call.dims['Sales.Process'] || 0
        const skillsScore = call.dims['Sales.Skills'] || 0
        const commScore = call.dims['Sales.Communication'] || 0
        
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
          ? "评分系统与赢单率呈现显著正相关，验证通过"
          : "评分系统与赢单率相关性不足，需要优化"
      }
    }

    return NextResponse.json(validationResult)

  } catch (error) {
    console.error('验证API错误:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: '验证失败', message: errorMessage },
      { status: 500 }
    )
  }
}
