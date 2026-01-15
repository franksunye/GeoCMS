
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

interface TagResult {
    code: string
    name: string
    treatedAgents: number
    controlAgents: number
    treatedWinRate: number
    controlWinRate: number
    ateWin: number
}

function main() {
    console.log('🚀 Naive Causal Analysis: Bathroom Win Rate')
    console.log('Methodology: Simple comparison (No PSM correction)\n')

    // 1. Get stats for agents focusing ONLY on Bathroom deals
    const agentStats = db.prepare(`
        SELECT 
            agent_id,
            COUNT(*) as total_deals,
            SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won_deals
        FROM sync_deals
        WHERE leak_area LIKE '%2%'
        AND agent_id IN (SELECT DISTINCT agent_id FROM biz_calls)
        GROUP BY agent_id
        HAVING total_deals >= 2
    `).all() as { agent_id: string; total_deals: number; won_deals: number }[]

    console.log(`📊 Found ${agentStats.length} agents with Bathroom-specific deals.\n`)

    // 2. Map high-score tags for these agents
    const agentHighScoreTags = db.prepare(`
        SELECT DISTINCT bc.agent_id, bt.tag_id
        FROM biz_call_tags bt
        JOIN biz_calls bc ON bt.call_id = bc.id
        WHERE bt.score >= 80
    `).all() as { agent_id: string; tag_id: string }[]

    const agentTagMap = new Map<string, Set<string>>()
    agentHighScoreTags.forEach(row => {
        if (!agentTagMap.has(row.agent_id)) agentTagMap.set(row.agent_id, new Set())
        agentTagMap.get(row.agent_id)!.add(row.tag_id)
    })

    // 3. Get tags
    const tags = db.prepare(`SELECT code, name FROM cfg_tags WHERE active = 1`).all() as { code: string; name: string }[]

    // 4. Calculate Naive ATE for Win Rate
    const results: TagResult[] = tags.map(tag => {
        const treatedAgents = agentStats.filter(a => agentTagMap.get(a.agent_id)?.has(tag.code))
        const controlAgents = agentStats.filter(a => !agentTagMap.get(a.agent_id)?.has(tag.code))

        const calcRate = (agents: typeof agentStats) => {
            if (agents.length === 0) return 0
            return agents.reduce((sum, a) => sum + (a.won_deals / a.total_deals), 0) / agents.length
        }

        const treatedWinRate = calcRate(treatedAgents)
        const controlWinRate = calcRate(controlAgents)

        return {
            code: tag.code,
            name: tag.name,
            treatedAgents: treatedAgents.length,
            controlAgents: controlAgents.length,
            treatedWinRate,
            controlWinRate,
            ateWin: treatedWinRate - controlWinRate
        }
    })

    // 5. Output results
    results.sort((a, b) => b.ateWin - a.ateWin)

    console.log('✅ NAIVE IMPACT ON WIN RATE (BATHROOM ONLY):')
    console.log('Tag Code             | Name                 | Win ATE    | Treat | Ctrl')
    console.log('---------------------+----------------------+------------+-------+-----')
    results.filter(r => r.treatedAgents >= 2).slice(0, 15).forEach(r => {
        const winColor = r.ateWin > 0 ? '\x1b[32m' : '\x1b[31m'
        console.log(`${r.code.padEnd(20)} | ${r.name.padEnd(20)} | ${winColor}${(r.ateWin * 100).toFixed(2).padStart(8)}%\x1b[0m | ${r.treatedAgents.toString().padStart(5)} | ${r.controlAgents.toString().padStart(4)}`)
    })

    console.log('\n❌ NEGATIVE NAIVE IMPACT (BATHROOM ONLY):')
    results.filter(r => r.treatedAgents >= 2).slice(-10).forEach(r => {
        const winColor = r.ateWin > 0 ? '\x1b[32m' : '\x1b[31m'
        console.log(`${r.code.padEnd(20)} | ${r.name.padEnd(20)} | ${winColor}${(r.ateWin * 100).toFixed(2).padStart(8)}%\x1b[0m | ${r.treatedAgents.toString().padStart(5)} | ${r.controlAgents.toString().padStart(4)}`)
    })

    db.close()
}

main()
