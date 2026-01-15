
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

const IDENTITY_GROUPS = {
    'Engineer (工程师)': ['工程师', '技术员', '专家', '工长'],
    'Master (师傅)': ['师傅', '老师傅', '工人', '干活的', '维修工']
}

// Relevant tags to analyze
const TAGS_OF_INTEREST = [
    'empathy_shown',
    'listening_good',
    'professional_tone',
    'solution_proposal_basic',
    'expertise_display',
    'objection_handled',
    'clear_explanation'
]

function investigateIdentityWithTags() {
    console.log('🕵️‍♂️ REFORM INVESTIGATION: IDENTITY via TAGS & SCORES')
    console.log('Goal: Validate "Engineer" vs "Master" performance using System Tags.\n')

    // 1. Get bathroom transcripts joined with deals
    const calls = db.prepare(`
        SELECT 
            st.deal_id,
            st.content,
            sd.outcome
        FROM sync_transcripts st
        JOIN sync_deals sd ON st.deal_id = sd.id
        WHERE sd.leak_area LIKE '%2%' 
    `).all() as { deal_id: string; content: string; outcome: string }[]

    // 2. Prepare aggregators
    const groupStats: Record<string, {
        count: number,
        wins: number,
        tagScores: Record<string, { sum: number, count: number }>
    }> = {}

    Object.keys(IDENTITY_GROUPS).forEach(k => {
        groupStats[k] = { count: 0, wins: 0, tagScores: {} }
        TAGS_OF_INTEREST.forEach(t => {
            groupStats[k].tagScores[t] = { sum: 0, count: 0 }
        })
    })

    // 3. Pre-fetch all tags for these deals to avoid N+1 queries
    // We can fetch all tags for bathroom deals in one go
    const allTags = db.prepare(`
        SELECT t.call_id, t.tag_id, t.score
        FROM biz_call_tags t
        JOIN sync_deals d ON t.call_id = d.id
        WHERE d.leak_area LIKE '%2%'
    `).all() as { call_id: string; tag_id: string; score: number }[]

    // Map deal_id -> tags
    const dealTags: Record<string, Record<string, number>> = {}
    allTags.forEach(r => {
        if (!dealTags[r.call_id]) dealTags[r.call_id] = {}
        dealTags[r.call_id][r.tag_id] = r.score
    })

    // 4. Process Calls
    let matchedCount = 0
    calls.forEach(row => {
        let matchedGroup = null
        for (const [group, terms] of Object.entries(IDENTITY_GROUPS)) {
            if (terms.some(t => row.content.includes(t))) {
                matchedGroup = group
                break
            }
        }

        if (matchedGroup) {
            matchedCount++
            const stats = groupStats[matchedGroup]
            stats.count++
            if (row.outcome === 'won') stats.wins++

            // Aggregate Tag Scores for this call
            const tags = dealTags[row.deal_id] || {}
            TAGS_OF_INTEREST.forEach(tagId => {
                if (tags[tagId]) {
                    stats.tagScores[tagId].sum += tags[tagId]
                    stats.tagScores[tagId].count++
                }
            })
        }
    })

    // 5. Output
    console.log(`Analyzed ${matchedCount} calls with Identity terms.\n`)

    console.log('Identity Group       | Win Rate | ' + TAGS_OF_INTEREST.map(t => t.slice(0, 10)).join(' | '))
    console.log('-'.repeat(120))

    Object.entries(groupStats).forEach(([group, data]) => {
        const winRate = (data.wins / data.count * 100).toFixed(1) + '%'

        const scores = TAGS_OF_INTEREST.map(t => {
            const ts = data.tagScores[t]
            return ts.count > 0 ? (ts.sum / ts.count).toFixed(2) : 'N/A'
        }).join('       | ')

        console.log(`${group.padEnd(20)} | ${winRate.padEnd(8)} | ${scores}`)
    })

    console.log('\n🧠 ANALYSIS:')
    // Calculate simple diffs
    const eng = groupStats['Engineer (工程师)']
    const mas = groupStats['Master (师傅)']

    TAGS_OF_INTEREST.forEach(t => {
        const engScore = eng.tagScores[t].count ? (eng.tagScores[t].sum / eng.tagScores[t].count) : 0
        const masScore = mas.tagScores[t].count ? (mas.tagScores[t].sum / mas.tagScores[t].count) : 0
        const diff = ((masScore - engScore) / engScore * 100).toFixed(1)

        if (Math.abs(Number(diff)) > 5) {
            const better = masScore > engScore ? 'Master' : 'Engineer'
            const color = masScore > engScore ? '✅' : '❌'
            console.log(`${color} ${t}: ${better} is higher by ${diff}% (${engScore.toFixed(2)} vs ${masScore.toFixed(2)})`)
        }
    })

    db.close()
}

investigateIdentityWithTags()
