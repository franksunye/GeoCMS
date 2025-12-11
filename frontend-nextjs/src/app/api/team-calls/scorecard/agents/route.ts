import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '7d'

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
    const agents = db.prepare('SELECT * FROM agents').all()

    // 2. Get Score Config (for weights)
    const scoreConfig = db.prepare('SELECT * FROM score_config LIMIT 1').get() as any
    const weights = {
      process: scoreConfig?.processWeight || 30,
      skills: scoreConfig?.skillsWeight || 50,
      communication: scoreConfig?.communicationWeight || 20
    }

    // 3. Get All Active Tags (to ensure consistent structure)
    const allTags = db.prepare('SELECT * FROM tags WHERE active = 1 AND category = ? ORDER BY name ASC').all('Sales') as any[]
    const processRefTags = allTags.filter(t => t.dimension === 'Process' || t.dimension === 'Sales.Process')
    const skillsRefTags = allTags.filter(t => t.dimension === 'Skills' || t.dimension === 'Sales.Skills')
    const commRefTags = allTags.filter(t => t.dimension === 'Communication' || t.dimension === 'Sales.Communication')

    // 4. Batch Query: Call Stats per Agent
    const agentStats = db.prepare(`
      SELECT 
        agentId,
        count(*) as totalCalls,
        sum(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wonCalls
      FROM calls 
      WHERE startedAt >= ?
      GROUP BY agentId
    `).all(cutoffIso) as any[]

    const statsMap = new Map(agentStats.map(s => [s.agentId, s]))

    // 5. Batch Query: Tag Scores per Agent
    const allTagScores = db.prepare(`
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

    // Map: AgentId -> TagId -> Score
    const agentTagScoresMap = new Map<string, Map<string, number>>()
    allTagScores.forEach((row: any) => {
      if (!agentTagScoresMap.has(row.agentId)) {
        agentTagScoresMap.set(row.agentId, new Map())
      }
      agentTagScoresMap.get(row.agentId)!.set(row.tagId, row.score)
    })

    // 6. Process each agent
    const formattedAgents = agents.map((agent: any) => {
      // A. Get Call Stats from Map
      const stats = statsMap.get(agent.id) || { totalCalls: 0, wonCalls: 0 }
      const recordings = stats.totalCalls
      const winRate = recordings > 0 ? Math.round((stats.wonCalls / recordings) * 100) : 0

      // B. Get Tag Scores from Map
      const agentScores = agentTagScoresMap.get(agent.id) || new Map()

      // C. Helper to build details array ensuring consistent order/length
      const buildDetails = (refTags: any[]) => {
        return refTags.map(tag => ({
          name: tag.name,
          score: Math.round(agentScores.get(tag.id) || 0)
        }))
      }

      const processDetails = buildDetails(processRefTags)
      const skillsDetails = buildDetails(skillsRefTags)
      const communicationDetails = buildDetails(commRefTags)

      // D. Calculate Dimension Scores (Hybrid: Assessed OR Mandatory)
      const calculateAverage = (refTags: any[]) => {
        let totalScore = 0
        let denominator = 0

        for (const tag of refTags) {
          const score = agentScores.get(tag.id)
          if (score !== undefined && score !== null) {
            // Case 1: Assessed (Triggered)
            totalScore += score
            denominator++
          } else if (tag.is_mandatory) {
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
    formattedAgents.sort((a: any, b: any) => b.overallScore - a.overallScore)

    return NextResponse.json(formattedAgents)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}
