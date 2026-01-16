
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

interface TermStat {
    term: string
    count: number
    wonCount: number
    lostCount: number
    isSubTermOf?: string
}

// 简单的中文停用词，主要过滤虚词
const STOP_CHARS = new Set([
    '的', '了', '呢', '啊', '哦', '嗯', '吧', '嘛', '呀', '着', '过', '么',
    '这个', '那个', '就是', '我们', '你们', '他们', '现在', '因为', '所以', '如果', '但是'
])

function runPMIDiscovery() {
    console.log('🔬 SCIENTIFIC KEYWORD DISCOVERY: PMI-BASED SEGMENTATION')
    console.log('Goal: Use Mutual Information to find REAL semantic words, not just random fragments.\n')

    // 1. Load Data
    const rows = db.prepare(`
        SELECT sd.outcome, st.content
        FROM sync_deals sd
        JOIN sync_transcripts st ON sd.id = st.deal_id
        WHERE sd.leak_area LIKE '%2%' AND sd.outcome IN ('won', 'lost')
    `).all() as { outcome: string; content: string }[]

    const rawDocs = rows.map(r => ({
        txt: r.content.replace(/[^\u4e00-\u9fa5]/g, ''), // Keep only Chinese
        outcome: r.outcome
    })).filter(d => d.txt.length > 5)

    console.log(`📊 Processing ${rawDocs.length} transcripts...`)

    // 2. Count N-grams (1, 2, 3, 4)
    const freqs = new Map<string, TermStat>()

    const addCount = (term: string, outcome: string) => {
        const stat = freqs.get(term) || { term, count: 0, wonCount: 0, lostCount: 0 }
        stat.count++
        if (outcome === 'won') stat.wonCount++
        else stat.lostCount++
        freqs.set(term, stat)
    }

    rawDocs.forEach(doc => {
        const text = doc.txt
        const seenInDoc = new Set<string>()

        for (let n = 1; n <= 4; n++) {
            for (let i = 0; i < text.length - n + 1; i++) {
                const term = text.substring(i, i + n)
                // Skip if contains stop chars (heuristic)
                /* if (n === 1 && STOP_CHARS.has(term)) continue
                if (n > 1) {
                   if (STOP_CHARS.has(term[0]) || STOP_CHARS.has(term[term.length-1])) continue
                }*/

                // Document Frequency Counting (count once per doc to reduce spam bias)
                if (!seenInDoc.has(term)) {
                    addCount(term, doc.outcome)
                    seenInDoc.add(term)
                }
            }
        }
    })

    // 3. PMI-like Filtering & Redundancy Removal
    // Logic: If P(AB) ~ P(A), then B adds no info -> AB is just A + redundancy? 
    // Wait, standard trick: If count(AB) is close to count(A), and A is shorter, usually A is the fragment of AB?
    // Actually: If count("卫生间") ~ count("卫生"), then "卫生" is likely redundant here if "生" rarely appears without "间" in this context.

    // Simplified "Left/Right Entropy" proxy:
    // If a short term appears mostly as part of a specific longer term, suppress the short term.

    const termsArray = Array.from(freqs.values()).sort((a, b) => b.count - a.count)
    const validTerms = new Map<string, TermStat>()

    // Filter 1: Min absolute frequency
    const MIN_FREQ = 10
    const filteredTerms = termsArray.filter(t => t.count >= MIN_FREQ)

    // Build containment map
    // For every long term, punish its substrings
    filteredTerms.forEach(long => {
        if (long.term.length <= 1) return

        // Check all possible substrings
        for (let len = 1; len < long.term.length; len++) {
            for (let i = 0; i <= long.term.length - len; i++) {
                const sub = long.term.substring(i, i + len)
                const subStat = freqs.get(sub)
                if (subStat) {
                    // If the substring appears almost exclusively inside this long term
                    // e.g. "免砸" appearing 100 times, and "免砸砖" appearing 95 times.
                    // Then "免砸" is redundant.
                    if (subStat.count * 0.85 < long.count) {
                        subStat.isSubTermOf = long.term
                    }
                }
            }
        }
    })

    // 4. Calculate Odds Ratio for surviving terms
    const results: any[] = []
    const totalWon = rawDocs.filter(d => d.outcome === 'won').length
    const totalLost = rawDocs.filter(d => d.outcome === 'lost').length

    filteredTerms.forEach(t => {
        if (t.isSubTermOf) return // Skip redundant fragments
        if (t.term.length < 2) return // Skip single chars usually
        if ([...STOP_CHARS].some(s => t.term.includes(s))) return // Skip terms with stop words (simple aggressive filter)

        const wonFreq = t.wonCount / totalWon
        const lostFreq = t.lostCount / totalLost

        // Impact Score
        const score = (wonFreq - lostFreq) * Math.log(t.count)

        results.push({
            term: t.term,
            score,
            wonFreq,
            lostFreq,
            count: t.count
        })
    })

    // 5. Output
    results.sort((a, b) => b.score - a.score)

    console.log('\n🌟 TRUE WINNING WORDS (PMI Corrected):')
    console.log('Term                 | Impact Score | Won Freq | Lost Freq | Count')
    console.log('---------------------+--------------+----------+-----------+------')
    results.slice(0, 20).forEach(r => {
        console.log(`${r.term.padEnd(20)} | ${r.score.toFixed(4).padStart(12)} | ${(r.wonFreq * 100).toFixed(1).padStart(7)}% | ${(r.lostFreq * 100).toFixed(1).padStart(8)}% | ${r.count}`)
    })

    results.sort((a, b) => a.score - b.score)
    console.log('\n💣 TRUE LOSING WORDS (PMI Corrected):')
    console.log('Term                 | Impact Score | Won Freq | Lost Freq | Count')
    console.log('---------------------+--------------+----------+-----------+------')
    results.slice(0, 20).forEach(r => {
        console.log(`${r.term.padEnd(20)} | ${r.score.toFixed(4).padStart(12)} | ${(r.wonFreq * 100).toFixed(1).padStart(7)}% | ${(r.lostFreq * 100).toFixed(1).padStart(8)}% | ${r.count}`)
    })

    db.close()
}

runPMIDiscovery()
