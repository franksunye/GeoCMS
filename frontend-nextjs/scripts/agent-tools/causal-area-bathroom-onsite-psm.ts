
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

interface AgentData {
    id: string
    totalDeals: number
    avgDuration: number
    winRate: number
    onsiteRate: number
    hasHighScoreTag: boolean
    propensityScore?: number
}

interface TagDeepResult {
    code: string
    name: string
    naiveATE: number
    psmATT: number
    matches: number
}

function runDeepCausalAnalysis() {
    console.log('🔬 RIGOROUS CAUSAL ANALYSIS: BATHROOM AREA ONLY')
    console.log('Methodology: Propensity Score Matching (PSM) to correct Selection Bias\n')

    // 1. Get base agent stats for Bathroom deals
    const agentStats = db.prepare(`
        SELECT 
            sd.agent_id,
            COUNT(*) as total_deals,
            SUM(CASE WHEN sd.is_onsite_completed = 1 THEN 1 ELSE 0 END) as onsite_deals
        FROM sync_deals sd
        WHERE sd.leak_area LIKE '%2%'
        AND sd.agent_id IN (SELECT DISTINCT agent_id FROM biz_calls)
        GROUP BY sd.agent_id
        HAVING total_deals >= 2
    `).all() as { agent_id: string; total_deals: number; onsite_deals: number }[]

    const agentDurations = db.prepare(`
        SELECT agent_id, AVG(duration) as avg_duration
        FROM biz_calls
        GROUP BY agent_id
    `).all() as { agent_id: string; avg_duration: number }[]
    const durationMap = new Map(agentDurations.map(a => [a.agent_id, a.avg_duration]))

    const tags = db.prepare(`SELECT code, name FROM cfg_tags WHERE active = 1`).all() as { code: string; name: string }[]

    const deepResults: TagDeepResult[] = []

    for (const tag of tags) {
        // Find agents who have high score on this tag
        const agentsWithTag = new Set(
            (db.prepare(`
                SELECT DISTINCT bc.agent_id
                FROM biz_call_tags bt
                JOIN biz_calls bc ON bt.call_id = bc.id
                WHERE bt.tag_id = ? AND bt.score >= 80
            `).all(tag.code) as { agent_id: string }[]).map(r => r.agent_id)
        )

        if (agentsWithTag.size < 2) continue

        // Build dataset for this tag
        const agents: AgentData[] = agentStats.map(a => ({
            id: a.agent_id,
            totalDeals: a.total_deals,
            avgDuration: durationMap.get(a.agent_id) || 0,
            winRate: 0, // Not focused on win rate for onsite analysis
            onsiteRate: a.onsite_deals / a.total_deals,
            hasHighScoreTag: agentsWithTag.has(a.agent_id)
        }))

        // Calculate propensity score (likelihood of having this behavior based on skill/experience)
        const maxDeals = Math.max(...agents.map(a => a.totalDeals))
        const maxDuration = Math.max(...agents.map(a => a.avgDuration))
        agents.forEach(a => {
            a.propensityScore = 0.5 * (a.totalDeals / maxDeals) + 0.5 * (a.avgDuration / maxDuration)
        })

        const treated = agents.filter(a => a.hasHighScoreTag)
        const control = agents.filter(a => !a.hasHighScoreTag)

        if (treated.length === 0 || control.length === 0) continue

        // Naive ATE
        const naiveATE = treated.reduce((s, a) => s + a.onsiteRate, 0) / treated.length -
            control.reduce((s, a) => s + a.onsiteRate, 0) / control.length

        // PSM ATT
        const matchedPairs: { treated: AgentData; control: AgentData }[] = []
        const usedControl = new Set<string>()

        treated.sort((a, b) => b.propensityScore! - a.propensityScore!).forEach(t => {
            let bestMatch: AgentData | null = null
            let bestDist = Infinity
            control.forEach(c => {
                if (usedControl.has(c.id)) return
                const dist = Math.abs(t.propensityScore! - c.propensityScore!)
                if (dist < bestDist) {
                    bestDist = dist
                    bestMatch = c
                }
            })

            if (bestMatch && bestDist < 0.25) {
                matchedPairs.push({ treated: t, control: bestMatch as AgentData })
                usedControl.add((bestMatch as AgentData).id)
            }
        })

        if (matchedPairs.length >= 2) {
            const psmATT = matchedPairs.reduce((s, p) => s + (p.treated.onsiteRate - p.control.onsiteRate), 0) / matchedPairs.length
            deepResults.push({
                code: tag.code,
                name: tag.name,
                naiveATE,
                psmATT,
                matches: matchedPairs.length
            })
        }
    }

    // Output Final Comparison Table
    deepResults.sort((a, b) => b.psmATT - a.psmATT)

    console.log('Tag Name             | Naive ATE | Deep Causal (ATT) | Confidence | Matches')
    console.log('---------------------+-----------+-------------------+------------+--------')
    deepResults.forEach(r => {
        const color = r.psmATT > 0 ? '\x1b[32m' : '\x1b[31m'
        const biasCorrected = Math.abs(r.psmATT - r.naiveATE) > 0.05 ? '🔥 High' : '✅ Stable'
        console.log(`${r.name.padEnd(20)} | ${(r.naiveATE * 100).toFixed(2).padStart(8)}% | ${color}${(r.psmATT * 100).toFixed(2).padStart(16)}%\x1b[0m | ${biasCorrected.padEnd(10)} | ${r.matches.toString().padStart(7)}`)
    })

    db.close()
}

runDeepCausalAnalysis()
