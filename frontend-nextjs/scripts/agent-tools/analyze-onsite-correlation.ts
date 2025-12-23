import { PrismaClient } from '../../src/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

// Initialize Prisma with Adapter
const DATABASE_URL = process.env.DATABASE_URL || 'file:./team-calls.db'
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

interface AgentStats {
    id: string
    name: string
    totalDeals: number
    onsiteCount: number
    onsiteRate: number
    tagScores: Map<string, number> // tagCode -> avgScore
}

async function main() {
    console.log('🔍 Drilling Down: Correlation Analysis by Individual Tag...\n')

    // 1. Fetch Data
    const deals = await prisma.deal.findMany({
        select: { id: true, agentId: true, isOnsiteCompleted: true }
    })

    const agentDealsMap = new Map<string, { total: number, onsite: number }>()
    deals.forEach((d: any) => {
        if (!agentDealsMap.has(d.agentId)) agentDealsMap.set(d.agentId, { total: 0, onsite: 0 })
        const stat = agentDealsMap.get(d.agentId)!
        stat.total++
        if (d.isOnsiteCompleted === 1) stat.onsite++
    })

    const allTags = await prisma.tag.findMany({ where: { active: 1 } })
    const tagNames = new Map(allTags.map(t => [t.code, t.name]))

    const callTags = await prisma.callTag.findMany({
        include: {
            tag: true,
            call: { select: { agentId: true } }
        }
    })

    const agentScoresMap = new Map<string, Map<string, number[]>>()
    callTags.forEach((a: any) => {
        const aid = a.call.agentId
        if (!agentScoresMap.has(aid)) agentScoresMap.set(aid, new Map())
        const tagMap = agentScoresMap.get(aid)!
        if (!tagMap.has(a.tag.code)) tagMap.set(a.tag.code, [])
        tagMap.get(a.tag.code)!.push(a.score)
    })

    // Filter agents with both data
    const agentsWithBoth = Array.from(agentDealsMap.keys()).filter(aid => agentScoresMap.has(aid))
    const agentsData = await prisma.agent.findMany({ where: { id: { in: agentsWithBoth } } })
    const agentNameMap = new Map(agentsData.map(a => [a.id, a.name]))

    const results: AgentStats[] = []
    for (const agentId of agentsWithBoth) {
        const stats = agentDealsMap.get(agentId)!
        const tagMap = agentScoresMap.get(agentId)!
        const tagAvgScores = new Map<string, number>()

        tagMap.forEach((scores, tagCode) => {
            const avg = scores.reduce((s, v) => s + v, 0) / scores.length
            tagAvgScores.set(tagCode, avg)
        })

        results.push({
            id: agentId,
            name: agentNameMap.get(agentId) || agentId.substring(agentId.length - 4),
            totalDeals: stats.total,
            onsiteCount: stats.onsite,
            onsiteRate: (stats.onsite / stats.total) * 100,
            tagScores: tagAvgScores
        })
    }

    // 2. Calculate Correlation for EACH Tag
    function calculateR(data: any[], xKey: (d: any) => number, yKey: (d: any) => number) {
        const n = data.length
        if (n < 2) return 0
        const x = data.map(xKey)
        const y = data.map(yKey)
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = y.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((prev, curr, i) => prev + curr * y[i], 0)
        const sumX2 = x.reduce((a, b) => a + b * b, 0)
        const sumY2 = y.reduce((a, b) => a + b * b, 0)
        const numerator = n * sumXY - sumX * sumY
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
        return denominator === 0 ? 0 : numerator / denominator
    }

    console.log(`📊 Analyzing ${allTags.length} tags across ${agentsWithBoth.length} agents...\n`)

    const tagAnalysis = allTags.map(tag => {
        // Only calculate if enough agents have scores for this tag
        const agentsWithTag = results.filter(r => r.tagScores.has(tag.code))
        if (agentsWithTag.length < 5) return { code: tag.code, name: tag.name, r: 0, sample: agentsWithTag.length }

        const r = calculateR(agentsWithTag, d => d.tagScores.get(tag.code)!, d => d.onsiteRate)
        return { code: tag.code, name: tag.name, r, sampleSize: agentsWithTag.length }
    })

    // 3. Output Top Positives and Top Negatives
    tagAnalysis.sort((a, b) => b.r - a.r)

    console.log('✅ Top Positive Correlations (These might drive Onsite visits):')
    console.log('Tag Code             | Tag Name             | Correlation | Sample')
    console.log('---------------------+----------------------+-------------+-------')
    tagAnalysis.filter(t => t.r > 0).slice(0, 10).forEach(t => {
        console.log(`${t.code.padEnd(20)} | ${t.name.padEnd(20)} | \x1b[32m${t.r.toFixed(4).padStart(11)}\x1b[0m | ${t.sampleSize}`)
    })

    console.log('\n❌ Top Negative Correlations (These might hinder Onsite visits):')
    console.log('Tag Code             | Tag Name             | Correlation | Sample')
    console.log('---------------------+----------------------+-------------+-------')
    tagAnalysis.filter(t => t.r < 0).reverse().slice(0, 10).reverse().forEach(t => {
        console.log(`${t.code.padEnd(20)} | ${t.name.padEnd(20)} | \x1b[31m${t.r.toFixed(4).padStart(11)}\x1b[0m | ${t.sampleSize}`)
    })

    console.log('\n💡 Analysis Summary:')
    const stronglyPositive = tagAnalysis.filter(t => t.r > 0.4)
    if (stronglyPositive.length > 0) {
        console.log(`- Found ${stronglyPositive.length} tags with strong positive correlation (> 0.4). Consider increasing their weights in the scoring system.`)
    } else {
        console.log('- No tags show a strong positive correlation in this sample.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
