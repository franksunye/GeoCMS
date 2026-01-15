
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

interface CheckResult {
    term: string
    agentMentionRate: number // How often is it the Agent speaking?
    userMentionRate: number // How often is it the User speaking?
    coOccurrence: Record<string, number> // Co-occurrence with other key terms
    avgDuration: number // To check for simple-job bias
}

const TARGET_TERMS = ['不拆', '注浆', '楼下', '合同']

function runRobustnessCheck() {
    console.log('🛡️ KEYWORD ROBUSTNESS CHECK: SANITY & CONTEXT VALIDATION')
    console.log('Goal: Verify if keywords are valid sales tactics or just statistical artifacts.\n')

    // 1. Get transcripts containing target terms
    const rows = db.prepare(`
        SELECT 
            st.deal_id,
            st.content,
            sd.outcome,
            bc.duration
        FROM sync_transcripts st
        JOIN sync_deals sd ON st.deal_id = sd.id
        JOIN biz_calls bc ON st.deal_id = bc.id -- Assuming 1:1 for simplicity in this check
        WHERE sd.leak_area LIKE '%2%'
    `).all() as { deal_id: string; content: string; outcome: string; duration: number }[]

    const results: Record<string, any> = {}

    TARGET_TERMS.forEach(term => {
        const hits = rows.filter(r => r.content.includes(term))
        if (hits.length === 0) return

        // Context Check: Who said it? (Heuristic: Agent usually speaks longer blocks or specific patterns)
        // Since we don't have speaker diarization in this raw text, we check for speaker markers if available
        // OR we just sample snippets to show the user.

        // Co-occurrence
        const coStats: Record<string, number> = {}
        TARGET_TERMS.forEach(other => {
            if (term === other) return
            const both = hits.filter(r => r.content.includes(other)).length
            coStats[other] = parseFloat((both / hits.length).toFixed(2))
        })

        // Duration Check (Complexity Proxy)
        const avgDuration = hits.reduce((s, r) => s + r.duration, 0) / hits.length
        const totalAvgDuration = rows.reduce((s, r) => s + r.duration, 0) / rows.length
        const durationLift = avgDuration / totalAvgDuration

        results[term] = {
            count: hits.length,
            winRate: hits.filter(r => r.outcome === 'won').length / hits.length,
            coOccurrence: coStats,
            durationLift: durationLift.toFixed(2) + 'x',
            sampleSnippets: hits.slice(0, 3).map(r => {
                const idx = r.content.indexOf(term)
                const start = Math.max(0, idx - 20)
                const end = Math.min(r.content.length, idx + 20)
                return '...' + r.content.substring(start, end) + '...'
            })
        }
    })

    // Output Report
    console.log('Term       | Win Rate | Duration (Complexity) | Co-occurs with... | Context Samples')
    console.log('-----------+----------+-----------------------+-------------------+----------------')

    Object.entries(results).forEach(([term, data]) => {
        const coString = Object.entries(data.coOccurrence)
            .filter(([_, rate]) => (rate as number) > 0.3) // Significant overlap
            .map(([t, r]) => `${t}(${(r as number) * 100}%)`)
            .join(', ') || 'Independent'

        console.log(`\n📌 [${term}] (N=${data.count})`)
        console.log(`   - Win Rate: ${(data.winRate * 100).toFixed(1)}%`)
        console.log(`   - Complexity: ${data.durationLift} (Avg duration vs global avg)`)
        console.log(`   - High Overlap: ${coString}`)
        console.log(`   - Context Snippets:`)
        data.sampleSnippets.forEach((s: string) => console.log(`     "${s.replace(/\n/g, ' ')}"`))
    })

    console.log('\n🧠 ANALYST INTERPRETATION GUIDE:')
    console.log('1. If Duration < 0.8x: Term might just indicate "easy jobs".')
    console.log('2. If Overlap > 50%: Terms are likely part of the same script block.')
    console.log('3. Snippets help identify if it is Agent pitching or User complaining.')

    db.close()
}

runRobustnessCheck()
