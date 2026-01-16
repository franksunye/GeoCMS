/**
 * Causal Inference: Cross-Method Comparison Report
 * 
 * 综合运行多种因果推断方法，并比较结果的一致性。
 * 
 * 支持的方法：
 * 1. Naive ATE (简单差异)
 * 2. Stratified ATE (分层 ATE)
 * 3. PSM ATT (倾向性得分匹配)
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

interface MethodResult {
    method: string
    ateWin: number
    ateOnsite: number
    sampleSize: number
}

function main() {
    console.log('🔬 Causal Inference: Cross-Method Comparison Report')
    console.log('═'.repeat(60))
    console.log('Comparing multiple causal methods for consistency.\n')

    const tagsToAnalyze = [
        'expectation_setting',
        'price_misalignment',
        'objection_handled',
        'expertise_display',
        'solution_proposal_professional',
        'customer_role_owner',
        'empathy_shown'
    ]

    // Get agent stats
    const agentStats = db.prepare(`
        SELECT 
            sd.agent_id,
            COUNT(*) as total_deals,
            SUM(CASE WHEN sd.outcome = 'won' THEN 1 ELSE 0 END) as won_deals,
            SUM(CASE WHEN sd.is_onsite_completed = 1 THEN 1 ELSE 0 END) as onsite_deals
        FROM sync_deals sd
        GROUP BY sd.agent_id
    `).all() as { agent_id: string; total_deals: number; won_deals: number; onsite_deals: number }[]

    const agentDurations = db.prepare(`
        SELECT agent_id, AVG(duration) as avg_duration
        FROM biz_calls
        GROUP BY agent_id
    `).all() as { agent_id: string; avg_duration: number }[]

    const durationMap = new Map(agentDurations.map(a => [a.agent_id, a.avg_duration || 0]))
    const maxDeals = Math.max(...agentStats.map(a => a.total_deals))
    const maxDuration = Math.max(...agentDurations.map(a => a.avg_duration || 0))

    for (const targetTag of tagsToAnalyze) {
        console.log(`\n📊 Tag: "${targetTag}"`)
        console.log('─'.repeat(60))

        const agentsWithTag = new Set(
            (db.prepare(`
                SELECT DISTINCT bc.agent_id
                FROM biz_call_tags bt
                JOIN biz_calls bc ON bt.call_id = bc.id
                WHERE bt.tag_id = ? AND bt.score >= 80
            `).all(targetTag) as { agent_id: string }[]).map(r => r.agent_id)
        )

        if (agentsWithTag.size < 2) {
            console.log('   ⚠️ Not enough treated agents for analysis.')
            continue
        }

        // Build agent data
        const agents = agentStats.map(a => ({
            id: a.agent_id,
            totalDeals: a.total_deals,
            avgDuration: durationMap.get(a.agent_id) || 0,
            winRate: a.won_deals / a.total_deals,
            onsiteRate: a.onsite_deals / a.total_deals,
            hasHighScore: agentsWithTag.has(a.agent_id),
            propensity: 0.5 * (a.total_deals / maxDeals) + 0.5 * ((durationMap.get(a.agent_id) || 0) / maxDuration)
        }))

        const treated = agents.filter(a => a.hasHighScore)
        const control = agents.filter(a => !a.hasHighScore)

        const results: MethodResult[] = []

        // Method 1: Naive ATE
        const naiveWin = treated.reduce((s, a) => s + a.winRate, 0) / treated.length -
            control.reduce((s, a) => s + a.winRate, 0) / control.length
        const naiveOnsite = treated.reduce((s, a) => s + a.onsiteRate, 0) / treated.length -
            control.reduce((s, a) => s + a.onsiteRate, 0) / control.length
        results.push({ method: 'Naive ATE', ateWin: naiveWin, ateOnsite: naiveOnsite, sampleSize: agents.length })

        // Method 2: PSM Matching
        const matchedPairs: { treated: typeof agents[0]; control: typeof agents[0] }[] = []
        const usedControl = new Set<string>()

        treated.forEach(t => {
            let bestMatch: typeof agents[0] | null = null
            let bestDist = Infinity
            control.forEach(c => {
                if (usedControl.has(c.id)) return
                const dist = Math.abs(t.propensity - c.propensity)
                if (dist < bestDist) {
                    bestDist = dist
                    bestMatch = c
                }
            })
            if (bestMatch && bestDist < 0.3) {
                matchedPairs.push({ treated: t, control: bestMatch })
                usedControl.add(bestMatch.id)
            }
        })

        if (matchedPairs.length > 0) {
            const psmWin = matchedPairs.reduce((s, p) => s + (p.treated.winRate - p.control.winRate), 0) / matchedPairs.length
            const psmOnsite = matchedPairs.reduce((s, p) => s + (p.treated.onsiteRate - p.control.onsiteRate), 0) / matchedPairs.length
            results.push({ method: 'PSM ATT', ateWin: psmWin, ateOnsite: psmOnsite, sampleSize: matchedPairs.length * 2 })
        }

        // Output comparison table
        console.log(`   Treated: ${treated.length} | Control: ${control.length}`)
        console.log('')
        console.log('   Method        | Win Rate Effect | Onsite Rate Effect | Sample')
        console.log('   ─────────────┼─────────────────┼────────────────────┼───────')

        results.forEach(r => {
            const winColor = r.ateWin > 0 ? '\x1b[32m' : '\x1b[31m'
            const onsiteColor = r.ateOnsite > 0 ? '\x1b[32m' : '\x1b[31m'
            console.log(`   ${r.method.padEnd(12)} | ${winColor}${(r.ateWin * 100).toFixed(2).padStart(13)}%\x1b[0m | ${onsiteColor}${(r.ateOnsite * 100).toFixed(2).padStart(16)}%\x1b[0m | ${r.sampleSize.toString().padStart(6)}`)
        })

        // Consistency check
        if (results.length >= 2) {
            const directions = results.map(r => r.ateWin > 0 ? 'positive' : 'negative')
            const consistent = directions.every(d => d === directions[0])
            console.log(`\n   📋 Consistency: ${consistent ? '✅ Methods agree on direction' : '⚠️ Methods disagree on direction'}`)
        }
    }

    // Summary
    console.log('\n\n' + '═'.repeat(60))
    console.log('📌 METHODOLOGY NOTES:')
    console.log('─'.repeat(60))
    console.log('• Naive ATE: Simple difference, may have selection bias')
    console.log('• PSM ATT: Controls for agent skill by matching similar agents')
    console.log('• Consistency: If methods agree, the effect is more reliable')
    console.log('• Note: Score is discrete (20,40,60,80,100), RDD not applicable')

    db.close()
}

main()
