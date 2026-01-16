
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

const IDENTITY_GROUPS = {
    'Engineer (工程师)': ['工程师', '技术员', '专家', '工长'],
    'Master (师傅)': ['师傅', '老师傅', '工人', '干活的', '维修工']
}

function investigateIdentity() {
    console.log('🕵️‍♂️ SPECIAL INVESTIGATION: IDENTITY LABELS (工程师 vs 师傅)')
    console.log('Goal: Prove if "Engineer" label hurts conversion and WHY.\n')

    // 1. Get bathroom transcripts
    const rows = db.prepare(`
        SELECT 
            st.deal_id,
            st.content,
            sd.outcome
        FROM sync_transcripts st
        JOIN sync_deals sd ON st.deal_id = sd.id
        WHERE sd.leak_area LIKE '%2%' 
    `).all() as { deal_id: string; content: string; outcome: string }[]

    // 2. Classify Calls
    const stats: Record<string, { count: number, win: number, lost: number, priceMentions: number }> = {}
    const contexts: Record<string, string[]> = {}

    Object.keys(IDENTITY_GROUPS).forEach(k => {
        stats[k] = { count: 0, win: 0, lost: 0, priceMentions: 0 }
        contexts[k] = []
    })

    rows.forEach(row => {
        let matchedGroup = null

        for (const [group, terms] of Object.entries(IDENTITY_GROUPS)) {
            if (terms.some(t => row.content.includes(t))) {
                matchedGroup = group
                break
            }
        }

        if (matchedGroup) {
            stats[matchedGroup].count++
            if (row.outcome === 'won') stats[matchedGroup].win++
            if (row.outcome === 'lost') stats[matchedGroup].lost++

            // Check if "expensive/money" is mentioned nearby
            if (['贵', '钱', '收费', '多少'].some(p => row.content.includes(p))) {
                stats[matchedGroup].priceMentions++
            }

            // Sample context (Store snippets for manual review)
            if (contexts[matchedGroup].length < 5) {
                // Find the term
                const term = IDENTITY_GROUPS[matchedGroup as keyof typeof IDENTITY_GROUPS].find(t => row.content.includes(t)) || ''
                const idx = row.content.indexOf(term)
                const start = Math.max(0, idx - 40)
                const end = Math.min(row.content.length, idx + 40)
                contexts[matchedGroup].push(`[${row.outcome.toUpperCase()}] ...${row.content.substring(start, end).replace(/\n/g, ' ')}...`)
            }
        }
    })

    // 3. Output Results
    console.log('Identity Label       | Win Rate | Price Anxiety (Mentions Money) | N')
    console.log('---------------------+----------+--------------------------------+-----')

    Object.entries(stats).forEach(([group, data]) => {
        const winRate = (data.win / data.count) * 100
        const priceRate = (data.priceMentions / data.count) * 100
        const color = winRate > 26.6 ? '\x1b[32m' : '\x1b[31m' // 26.6% avg

        console.log(`${group.padEnd(20)} | ${color}${winRate.toFixed(1)}%\x1b[0m    | ${priceRate.toFixed(1)}%                          | ${data.count}`)
    })

    console.log('\n🧠 CONTEXT ANALYSIS (Why did they lose/win?)')
    Object.entries(contexts).forEach(([group, snippets]) => {
        console.log(`\n📂 ${group} Contexts:`)
        snippets.forEach(s => console.log(`   ${s}`))
    })

    // 4. Direct Head-to-Head (Excluding overlaps done by simple priority above)
    // Interpretation logic
    const engWin = (stats['Engineer (工程师)'].win / stats['Engineer (工程师)'].count)
    const mastWin = (stats['Master (师傅)'].win / stats['Master (师傅)'].count)

    console.log('\n⚖️  VERDICT:')
    if (mastWin > engWin * 1.2) {
        console.log(`✅ PROVEN: "Master" significantly outperforms "Engineer" (+${((mastWin - engWin) * 100).toFixed(1)}%).`)
        console.log(`   Hypothesis: Clients feel "Engineer" implies higher formal costs.`)
    } else {
        console.log(`⚠️ INCONCLUSIVE: No massive difference found. Check context manually.`)
    }

    db.close()
}

investigateIdentity()
