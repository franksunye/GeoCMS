/**
 * Causal Inference: Propensity Score Matching (PSM)
 * 
 * 解决的问题：
 * 在 ATE 分析中，"高分销售员"可能本身就是高手（选择偏差）。
 * PSM 通过匹配"特征相似但行为不同"的销售员来消除这种偏差。
 * 
 * 实现逻辑：
 * 1. 计算每个销售员的"倾向性得分"（被分配到干预组的概率）
 * 2. 基于倾向性得分进行匹配（Nearest Neighbor Matching）
 * 3. 只在匹配对中计算 ATE
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

interface AgentFeatures {
    id: string
    totalDeals: number
    avgDuration: number
    winRate: number
    onsiteRate: number
    hasHighScoreTag: boolean
    propensityScore?: number
}

function main() {
    console.log('🔬 Causal Inference: Propensity Score Matching (PSM)')
    console.log('Goal: Control for agent skill by matching similar agents.\n')

    // 1. Collect agent features (covariates for propensity model)
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

    const durationMap = new Map(agentDurations.map(a => [a.agent_id, a.avg_duration]))

    // 2. Get which agents have high scores on specific tags
    const targetTag = 'empathy_shown' // We'll analyze one tag at a time

    const agentsWithTag = new Set(
        (db.prepare(`
            SELECT DISTINCT bc.agent_id
            FROM biz_call_tags bt
            JOIN biz_calls bc ON bt.call_id = bc.id
            WHERE bt.tag_id = ? AND bt.score >= 80
        `).all(targetTag) as { agent_id: string }[]).map(r => r.agent_id)
    )

    console.log(`📊 Analyzing tag: "${targetTag}"`)
    console.log(`   Treated agents (has high score): ${agentsWithTag.size}`)
    console.log(`   Control agents: ${agentStats.length - agentsWithTag.size}\n`)

    // 3. Build agent feature vectors
    const agents: AgentFeatures[] = agentStats.map(a => ({
        id: a.agent_id,
        totalDeals: a.total_deals,
        avgDuration: durationMap.get(a.agent_id) || 0,
        winRate: a.won_deals / a.total_deals,
        onsiteRate: a.onsite_deals / a.total_deals,
        hasHighScoreTag: agentsWithTag.has(a.agent_id)
    }))

    // 4. Calculate propensity score using logistic-like scoring
    // (Simplified: using normalized features as propensity proxy)
    const maxDeals = Math.max(...agents.map(a => a.totalDeals))
    const maxDuration = Math.max(...agents.map(a => a.avgDuration))

    agents.forEach(a => {
        // Propensity = likelihood of being in treatment group based on covariates
        // Higher deals + longer duration → more likely to have high score
        a.propensityScore = 0.5 * (a.totalDeals / maxDeals) + 0.5 * (a.avgDuration / maxDuration)
    })

    // 5. Perform Nearest Neighbor Matching
    const treated = agents.filter(a => a.hasHighScoreTag)
    const control = agents.filter(a => !a.hasHighScoreTag)

    console.log('🔗 Performing Nearest Neighbor Matching...')

    const matchedPairs: { treated: AgentFeatures; control: AgentFeatures }[] = []
    const usedControl = new Set<string>()

    treated.forEach(t => {
        // Find closest control by propensity score
        let bestMatch: AgentFeatures | null = null
        let bestDistance = Infinity

        control.forEach(c => {
            if (usedControl.has(c.id)) return
            const distance = Math.abs(t.propensityScore! - c.propensityScore!)
            if (distance < bestDistance) {
                bestDistance = distance
                bestMatch = c
            }
        })

        if (bestMatch && bestDistance < 0.2) { // Caliper = 0.2
            matchedPairs.push({ treated: t, control: bestMatch })
            usedControl.add(bestMatch.id)
        }
    })

    console.log(`   Matched pairs: ${matchedPairs.length} (caliper = 0.2)\n`)

    // 6. Calculate ATT (Average Treatment Effect on Treated) from matched pairs
    if (matchedPairs.length === 0) {
        console.log('❌ No matched pairs found. Try adjusting caliper or features.')
        db.close()
        return
    }

    const attWin = matchedPairs.reduce((sum, p) =>
        sum + (p.treated.winRate - p.control.winRate), 0) / matchedPairs.length
    const attOnsite = matchedPairs.reduce((sum, p) =>
        sum + (p.treated.onsiteRate - p.control.onsiteRate), 0) / matchedPairs.length

    console.log('📈 RESULTS: Average Treatment Effect on Treated (ATT)')
    console.log('─'.repeat(50))
    const winColor = attWin > 0 ? '\x1b[32m' : '\x1b[31m'
    const onsiteColor = attOnsite > 0 ? '\x1b[32m' : '\x1b[31m'
    console.log(`   Win Rate Effect:    ${winColor}${(attWin * 100).toFixed(2)}%\x1b[0m`)
    console.log(`   Onsite Rate Effect: ${onsiteColor}${(attOnsite * 100).toFixed(2)}%\x1b[0m`)

    // 7. Show sample matched pairs for verification
    console.log('\n🔍 Sample Matched Pairs (for verification):')
    matchedPairs.slice(0, 5).forEach((p, i) => {
        console.log(`   Pair ${i + 1}: Treated(deals=${p.treated.totalDeals}, dur=${p.treated.avgDuration.toFixed(0)}s, win=${(p.treated.winRate * 100).toFixed(1)}%) ↔ Control(deals=${p.control.totalDeals}, dur=${p.control.avgDuration.toFixed(0)}s, win=${(p.control.winRate * 100).toFixed(1)}%)`)
    })

    // 8. Compare with naive ATE
    const naiveAteWin = treated.reduce((s, a) => s + a.winRate, 0) / treated.length -
        control.reduce((s, a) => s + a.winRate, 0) / control.length
    const naiveAteOnsite = treated.reduce((s, a) => s + a.onsiteRate, 0) / treated.length -
        control.reduce((s, a) => s + a.onsiteRate, 0) / control.length

    console.log('\n📊 Comparison: PSM ATT vs Naive ATE')
    console.log('─'.repeat(50))
    console.log(`   Naive ATE (Win):    ${(naiveAteWin * 100).toFixed(2)}%`)
    console.log(`   PSM ATT (Win):      ${(attWin * 100).toFixed(2)}%`)
    console.log(`   Difference:         ${((attWin - naiveAteWin) * 100).toFixed(2)}% ${Math.abs(attWin - naiveAteWin) > 0.01 ? '(selection bias corrected!)' : ''}`)

    db.close()
}

main()
