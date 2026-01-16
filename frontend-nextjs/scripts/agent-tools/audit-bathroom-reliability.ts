
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

function runBathroomAudit() {
    console.log('🛡️ BATHROOM RELIABILITY AUDIT: AGENT-LEVEL DRILL DOWN')

    // 1. Get Base Deal Stats per Agent (Leak Area 2 Only)
    const dealStats = db.prepare(`
        SELECT 
            sa.id as agent_id,
            sa.name as agent_name,
            COUNT(DISTINCT sd.id) as total_deals,
            SUM(CASE WHEN sd.is_onsite_completed = 1 THEN 1 ELSE 0 END) as onsite_count,
            SUM(CASE WHEN sd.outcome = 'won' THEN 1 ELSE 0 END) as win_count
        FROM sync_deals sd
        JOIN sync_agents sa ON sd.agent_id = sa.id
        WHERE sd.leak_area LIKE '%2%'
        GROUP BY sa.id, sa.name
        HAVING total_deals >= 10
    `).all() as { agent_id: string; agent_name: string; total_deals: number; onsite_count: number; win_count: number }[]

    // 2. Get Tag Scores per Agent (Leak Area 2 Only)
    // We filter deals first, then join tags
    const tagStats = db.prepare(`
        SELECT 
            sd.agent_id,
            bt.tag_id,
            AVG(bt.score) as avg_score
        FROM sync_deals sd
        JOIN biz_call_tags bt ON sd.id = bt.call_id
        WHERE sd.leak_area LIKE '%2%'
        AND bt.tag_id IN ('professional_tone', 'skill_handle_objection_trust', 'solution_proposal_basic', 'empathy_shown')
        GROUP BY sd.agent_id, bt.tag_id
    `).all() as { agent_id: string; tag_id: string; avg_score: number }[]

    // 3. Merge Data
    const agentMap = new Map<string, any>()
    dealStats.forEach(d => {
        agentMap.set(d.agent_id, {
            ...d,
            onsiteRate: d.onsite_count / d.total_deals,
            winRate: d.win_count / d.total_deals,
            scores: {}
        })
    })

    tagStats.forEach(t => {
        const agent = agentMap.get(t.agent_id)
        if (agent) {
            agent.scores[t.tag_id] = t.avg_score
        }
    })

    const agents = Array.from(agentMap.values()).filter(a => Object.keys(a.scores).length > 0) // Filter out agents with no tags

    // 4. Analysis 1: The "Professional Tone" Trap
    console.log(`\n📊 1. "Professional Tone" Trap Audit (Agents with High Pro Scores)`)
    console.log('Agent Name       | Calls | Pro Tone (Score) | Onsite Rate (Real) | Win Rate (Real)')
    console.log('-----------------+-------+------------------+--------------------+----------------')

    const sortedByPro = [...agents].sort((a, b) => (b.scores['professional_tone'] || 0) - (a.scores['professional_tone'] || 0)).slice(0, 10)

    sortedByPro.forEach(a => {
        const pro = a.scores['professional_tone'] || 0
        console.log(`${a.agent_name.padEnd(16)} | ${a.total_deals.toString().padEnd(5)} | ${pro.toFixed(1).padEnd(16)} | ${(a.onsiteRate * 100).toFixed(1)}%            | ${(a.winRate * 100).toFixed(1)}%`)
    })

    // 5. Analysis 2: The "Trust Handling" Hero
    console.log(`\n🛡️ 2. "Trust Handling" Hero Audit (Agents with High Trust Scores)`)
    console.log('Agent Name       | Calls | Trust (Score)    | Onsite Rate (Real) | Win Rate (Real)')
    console.log('-----------------+-------+------------------+--------------------+----------------')

    const sortedByTrust = [...agents].sort((a, b) => (b.scores['skill_handle_objection_trust'] || 0) - (a.scores['skill_handle_objection_trust'] || 0)).slice(0, 10)

    sortedByTrust.forEach(a => {
        const trust = a.scores['skill_handle_objection_trust'] || 0
        console.log(`${a.agent_name.padEnd(16)} | ${a.total_deals.toString().padEnd(5)} | ${trust.toFixed(1).padEnd(16)} | ${(a.onsiteRate * 100).toFixed(1)}%            | ${(a.winRate * 100).toFixed(1)}%`)
    })

    // 6. Analysis 3: Head-to-Head (Pro vs Trust)
    console.log(`\n⚖️ 3. Agent Pair Analysis (Head-to-Head)`)

    let bestPair = null
    let maxContrast = 0

    // Try to find a pair with similar volume but drastic diff in Pro Tone
    // And ideally show that the Low Pro one wins more onsite

    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const a = agents[i]
            const b = agents[j]

            // Similarity: Volume
            if (Math.abs(a.total_deals - b.total_deals) > 50) continue

            const proA = a.scores['professional_tone'] || 0
            const proB = b.scores['professional_tone'] || 0

            const diff = Math.abs(proA - proB)
            if (diff > 15 && diff > maxContrast) { // Using raw score diff (0-100 usually 40-80) range check
                // Scores are avg: likely 40-80 range on 0-100 scale? Or 1-5?
                // The checklist update said 1-5. DB schema said "score INTEGER".
                // Let's assume diff > 1.0 if 1-5, or > 20 if 0-100.
                // Wait, previous output showed "88.0" for Xiong Huaxiang. And "0.0" for others.
                // So it's likely 0-100. Let's assume threshold 15.
                bestPair = { a, b, diff }
                maxContrast = diff
            }
        }
    }

    if (bestPair) {
        const { a, b } = bestPair
        const high = (a.scores['professional_tone'] || 0) > (b.scores['professional_tone'] || 0) ? a : b
        const low = (a.scores['professional_tone'] || 0) > (b.scores['professional_tone'] || 0) ? b : a

        console.log(`Pair Found: ${high.agent_name} (High Pro) vs ${low.agent_name} (Low Pro)`)
        console.log(`- ${high.agent_name}: Pro=${(high.scores['professional_tone'] || 0).toFixed(1)}, Onsite=${(high.onsiteRate * 100).toFixed(1)}%`)
        console.log(`- ${low.agent_name}:  Pro=${(low.scores['professional_tone'] || 0).toFixed(1)}, Onsite=${(low.onsiteRate * 100).toFixed(1)}%`)

        const gap = (low.onsiteRate - high.onsiteRate) * 100
        console.log(`-> Impact: Onsite Gap ${gap > 0 ? '+' : ''}${gap.toFixed(1)}% for Low Professionalism`)
    } else {
        console.log("No clear contrast pair found.")
    }

    db.close()
}

runBathroomAudit()
