
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

const INJECTION_TERMS = ['注浆', '注胶', '灌浆', '打针', '免砸砖']
// "免砸砖" is often a euphemism for injection, we need to check if they are decoupled.

function investigateInjection() {
    console.log('🕵️‍♂️ SPECIAL INVESTIGATION: "INJECTION" (注浆) CONTEXT ANALYSIS')
    console.log('Goal: Determine if "Injection" is being sold as a solution OR warned against.\n')

    // 1. Get all transcripts containing related terms
    const pattern = INJECTION_TERMS.map(t => `st.content LIKE '%${t}%'`).join(' OR ')

    const rows = db.prepare(`
        SELECT 
            st.deal_id,
            st.content,
            sd.outcome
        FROM sync_transcripts st
        JOIN sync_deals sd ON st.deal_id = sd.id
        WHERE sd.leak_area LIKE '%2%' 
        AND (${pattern})
    `).all() as { deal_id: string; content: string; outcome: string }[]

    console.log(`📊 Found ${rows.length} transcripts mentioning Injection terms.\n`)

    // 2. Analyze Context Pattern
    const stats = {
        total: rows.length,
        won: rows.filter(r => r.outcome === 'won').length,
        terms: {} as Record<string, { count: number, win: number, context: string[] }>
    }

    INJECTION_TERMS.forEach(term => {
        const hits = rows.filter(r => r.content.includes(term))
        if (hits.length === 0) return

        stats.terms[term] = {
            count: hits.length,
            win: hits.filter(r => r.outcome === 'won').length,
            context: hits.slice(0, 5).map(r => {
                const idx = r.content.indexOf(term)
                const start = Math.max(0, idx - 30)
                const end = Math.min(r.content.length, idx + 30)
                return `[${r.outcome.toUpperCase()}] ...${r.content.substring(start, end).replace(/\n/g, ' ')}...`
            })
        }
    })

    // 3. Output Deep Dive
    console.log('Term       | Count | Win Rate | Context Sampling (What are they saying?)')
    console.log('-----------+-------+----------+-----------------------------------------')

    Object.entries(stats.terms).forEach(([term, data]) => {
        const rate = (data.win / data.count) * 100
        const color = rate > 26.6 ? '\x1b[32m' : '\x1b[31m' // 26.6% is avg win rate

        console.log(`\n📌 [${term}] (N=${data.count})`)
        console.log(`   - Win Rate: ${color}${rate.toFixed(1)}%\x1b[0m (Avg: 26.6%)`)
        console.log(`   - Sample Contexts:`)
        data.context.forEach(c => console.log(`     ${c}`))
    })

    // 4. Check Co-occurrence with Negative Warnings
    const NEGATIVE_TERMS = ['骗', '没用', '复漏', '管不住', '按斤', '胶']
    const warningHits = rows.filter(r => NEGATIVE_TERMS.some(neg => r.content.includes(neg)))

    console.log(`\n⚠️  WARNING CHECK`)
    console.log(`   ${warningHits.length} / ${rows.length} calls mentions negative words (e.g. 骗, 没用) alongside injection.`)
    console.log(`   Win Rate in Warning Calls: ${((warningHits.filter(r => r.outcome === 'won').length / warningHits.length || 0) * 100).toFixed(1)}%`)

    if (warningHits.length > 0) {
        console.log(`   Sample Warning Contexts:`)
        warningHits.slice(0, 3).forEach(r => {
            console.log(`     [${r.outcome.toUpperCase()}] ...${r.content.substring(0, 60).replace(/\n/g, ' ')}...`)
        })
    }

    db.close()
}

investigateInjection()
