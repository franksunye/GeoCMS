import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
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
    const allTags = db.prepare('SELECT * FROM tags WHERE active = 1 ORDER BY name ASC').all() as any[]
    const processRefTags = allTags.filter(t => t.dimension === 'Sales.Process')
    const skillsRefTags = allTags.filter(t => t.dimension === 'Sales.Skills')
    const commRefTags = allTags.filter(t => t.dimension === 'Sales.Communication')

    // 4. Process each agent
    const formattedAgents = agents.map((agent: any) => {
      // A. Get Call Stats
      const callStats = db.prepare(`
        SELECT 
          count(*) as totalCalls,
          sum(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as wonCalls
        FROM calls 
        WHERE agentId = ?
      `).get(agent.id) as any

      const recordings = callStats.totalCalls || 0
      const winRate = recordings > 0 ? Math.round((callStats.wonCalls / recordings) * 100) : 0

      // B. Get Tag Scores (Grouped by Dimension)
      const tagScores = db.prepare(`
        SELECT 
          t.id as tagId,
          AVG(ca.score) as score
        FROM call_assessments ca 
        JOIN calls c ON c.id = ca.callId 
        JOIN tags t ON t.id = ca.tagId 
        WHERE c.agentId = ?
        GROUP BY t.id
      `).all(agent.id) as any[]

      // Create a map for O(1) lookup
      const scoreMap = new Map(tagScores.map(t => [t.tagId, t.score]))

      // C. Helper to build details array ensuring consistent order/length
      const buildDetails = (refTags: any[]) => {
        return refTags.map(tag => ({
          name: tag.name,
          score: Math.round(scoreMap.get(tag.id) || 0)
        }))
      }

      const processDetails = buildDetails(processRefTags)
      const skillsDetails = buildDetails(skillsRefTags)
      const communicationDetails = buildDetails(commRefTags)

      // D. Calculate Dimension Scores (Average of the details)
      const calculateAverage = (details: any[]) => 
        details.length > 0 
          ? Math.round(details.reduce((acc, item) => acc + item.score, 0) / details.length) 
          : 0

      const processScore = calculateAverage(processDetails)
      const skillsScore = calculateAverage(skillsDetails)
      const commScore = calculateAverage(communicationDetails)

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
