/**
 * Causal Driver Analysis Engine v2.1
 * 
 * Uses raw SQL for precise data joins.
 * Calculates ATE by comparing agent outcomes with/without high-score behaviors.
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`)
    process.exit(1)
}

const db = new Database(dbPath)

interface TagResult {
    code: string
    name: string
    treatedAgents: number
    controlAgents: number
    treatedWinRate: number
    controlWinRate: number
    treatedOnsiteRate: number
    controlOnsiteRate: number
    ateWin: number
    ateOnsite: number
}

function main() {
    console.log('🚀 Causal Driver Analysis Engine v2.1')
    console.log('Methodology: Agent-level stratification using raw SQL.\n')

    // 1. Get all agents with their deal outcomes
    const agentStats = db.prepare(`
        SELECT 
            agent_id,
            COUNT(*) as total_deals,
            SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won_deals,
            SUM(CASE WHEN is_onsite_completed = 1 THEN 1 ELSE 0 END) as onsite_deals
        FROM sync_deals
        WHERE agent_id IN (SELECT DISTINCT agent_id FROM biz_calls)
        GROUP BY agent_id
    `).all() as { agent_id: string; total_deals: number; won_deals: number; onsite_deals: number }[]

    console.log(`📊 Found ${agentStats.length} agents with call data and deal outcomes.`)

    // 2. For each agent, determine which tags they have high-score on
    const agentHighScoreTags = db.prepare(`
        SELECT DISTINCT bc.agent_id, bt.tag_id
        FROM biz_call_tags bt
        JOIN biz_calls bc ON bt.call_id = bc.id
        WHERE bt.score >= 80
    `).all() as { agent_id: string; tag_id: string }[]

    console.log(`🔍 Found ${agentHighScoreTags.length} agent-tag high-score pairs.`)

    // Build agent -> Set<tag> map
    const agentTagMap = new Map<string, Set<string>>()
    agentHighScoreTags.forEach(row => {
        if (!agentTagMap.has(row.agent_id)) agentTagMap.set(row.agent_id, new Set())
        agentTagMap.get(row.agent_id)!.add(row.tag_id)
    })

    console.log(`🔗 ${agentTagMap.size} agents have at least one high-score tag.\n`)

    // 3. Get all active tags
    const tags = db.prepare(`SELECT code, name FROM cfg_tags WHERE active = 1`).all() as { code: string; name: string }[]

    // 4. Calculate ATE for each tag
    const results: TagResult[] = tags.map(tag => {
        const treatedAgents = agentStats.filter(a => agentTagMap.get(a.agent_id)?.has(tag.code))
        const controlAgents = agentStats.filter(a => !agentTagMap.get(a.agent_id)?.has(tag.code))

        const calcRate = (agents: typeof agentStats, field: 'won_deals' | 'onsite_deals') => {
            if (agents.length === 0) return 0
            return agents.reduce((sum, a) => sum + (a[field] / a.total_deals), 0) / agents.length
        }

        const treatedWinRate = calcRate(treatedAgents, 'won_deals')
        const controlWinRate = calcRate(controlAgents, 'won_deals')
        const treatedOnsiteRate = calcRate(treatedAgents, 'onsite_deals')
        const controlOnsiteRate = calcRate(controlAgents, 'onsite_deals')

        return {
            code: tag.code,
            name: tag.name,
            treatedAgents: treatedAgents.length,
            controlAgents: controlAgents.length,
            treatedWinRate,
            controlWinRate,
            treatedOnsiteRate,
            controlOnsiteRate,
            ateWin: treatedWinRate - controlWinRate,
            ateOnsite: treatedOnsiteRate - controlOnsiteRate
        }
    })

    // 5. Output Results
    results.sort((a, b) => b.ateWin - a.ateWin)

    console.log('✅ CAUSAL IMPACT ON WIN RATE (Top 15):')
    console.log('Tag Code             | Name                 | Win ATE  | Onsite ATE | Treat | Ctrl')
    console.log('---------------------+----------------------+----------+------------+-------+-----')
    results.slice(0, 15).forEach(r => {
        const winColor = r.ateWin > 0 ? '\x1b[32m' : '\x1b[31m'
        const onsiteColor = r.ateOnsite > 0 ? '\x1b[32m' : '\x1b[31m'
        console.log(`${r.code.padEnd(20)} | ${r.name.padEnd(20)} | ${winColor}${(r.ateWin * 100).toFixed(2).padStart(6)}%\x1b[0m | ${onsiteColor}${(r.ateOnsite * 100).toFixed(2).padStart(8)}%\x1b[0m | ${r.treatedAgents.toString().padStart(5)} | ${r.controlAgents.toString().padStart(4)}`)
    })

    console.log('\n❌ NEGATIVE CAUSAL IMPACT (Bottom 10):')
    results.slice(-10).forEach(r => {
        const winColor = r.ateWin > 0 ? '\x1b[32m' : '\x1b[31m'
        const onsiteColor = r.ateOnsite > 0 ? '\x1b[32m' : '\x1b[31m'
        console.log(`${r.code.padEnd(20)} | ${r.name.padEnd(20)} | ${winColor}${(r.ateWin * 100).toFixed(2).padStart(6)}%\x1b[0m | ${onsiteColor}${(r.ateOnsite * 100).toFixed(2).padStart(8)}%\x1b[0m | ${r.treatedAgents.toString().padStart(5)} | ${r.controlAgents.toString().padStart(4)}`)
    })

    // Key insights
    const validResults = results.filter(r => r.treatedAgents >= 3)
    if (validResults.length > 0) {
        const topWin = validResults.sort((a, b) => b.ateWin - a.ateWin)[0]
        const topOnsite = validResults.sort((a, b) => b.ateOnsite - a.ateOnsite)[0]
        console.log('\n💡 KEY INSIGHTS (min 3 treated agents):')
        console.log(`  - "${topWin.name}" yields +${(topWin.ateWin * 100).toFixed(1)}% higher WIN rate.`)
        console.log(`  - "${topOnsite.name}" yields +${(topOnsite.ateOnsite * 100).toFixed(1)}% higher ONSITE rate.`)
    }

    db.close()
}

main()
