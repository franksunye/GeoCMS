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

// Initialize Prisma
const DATABASE_URL = process.env.DATABASE_URL || 'file:./team-calls.db'
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

interface AgentStats {
    id: string
    name: string
    totalDeals: number
    wonCount: number
    winRate: number
    processScore: number
    skillsScore: number
    commScore: number
    overallScore: number
    tagAvgScores: Map<string, number>
}

async function main() {
    console.log('🚀 Starting Win Rate (成交率) Correlation Analysis...\n')

    // 1. Load Configuration
    const scoreConfigRaw = await prisma.scoreConfig.findFirst()
    const scoreWeights = {
        process: scoreConfigRaw?.processWeight || 30,
        skills: scoreConfigRaw?.skillsWeight || 50,
        comm: scoreConfigRaw?.communicationWeight || 20
    }

    const scoringRules = await prisma.scoringRule.findMany({ where: { active: 1, ruleType: 'TagBased' } })
    const tagWeightMap = new Map(scoringRules.map(r => [r.tagCode, r.weight]))

    // 2. Fetch Data
    const deals = await prisma.deal.findMany({
        select: { id: true, agentId: true, outcome: true }
    })

    const agentDealsMap = new Map<string, { total: number, won: number }>()
    deals.forEach((d: any) => {
        if (!agentDealsMap.has(d.agentId)) agentDealsMap.set(d.agentId, { total: 0, won: 0 })
        const stat = agentDealsMap.get(d.agentId)!
        stat.total++
        if (d.outcome === 'won') stat.won++
    })

    const allTags = await prisma.tag.findMany({ where: { active: 1 } })
    const callTags = await prisma.callTag.findMany({
        include: { tag: true, call: { select: { agentId: true } } }
    })

    const agentScoresMap = new Map<string, Map<string, number[]>>()
    callTags.forEach((a: any) => {
        const aid = a.call.agentId
        if (!agentScoresMap.has(aid)) agentScoresMap.set(aid, new Map())
        const tagMap = agentScoresMap.get(aid)!
        if (!tagMap.has(a.tag.code)) tagMap.set(a.tag.code, [])
        tagMap.get(a.tag.code)!.push(a.score)
    })

    const agentsWithBoth = Array.from(agentDealsMap.keys()).filter(aid => agentScoresMap.has(aid))
    const agentsData = await prisma.agent.findMany({ where: { id: { in: agentsWithBoth } } })
    const agentNameMap = new Map(agentsData.map(a => [a.id, a.name]))

    const getDimensionCategory = (dim: string): string => {
        if (dim === 'Process' || dim === 'Sales.Process') return 'Process'
        if (dim === 'Communication' || dim === 'Sales.Communication') return 'Communication'
        if (dim === 'Skills' || dim === 'Sales.Skills' || dim === 'Intent' || dim === 'Constraint') return 'Skills'
        return 'Other'
    }

    const results: AgentStats[] = []
    for (const agentId of agentsWithBoth) {
        const dStat = agentDealsMap.get(agentId)!
        const tMap = agentScoresMap.get(agentId)!

        const calcDimScore = (dim: string) => {
            let weightedSum = 0, weightSum = 0
            allTags.filter(t => getDimensionCategory(t.dimension) === dim).forEach(t => {
                const scores = tMap.get(t.code)
                const weight = tagWeightMap.get(t.code) || 1.0
                if (scores && scores.length > 0) {
                    weightedSum += (scores.reduce((a, b) => a + b, 0) / scores.length) * weight
                    weightSum += weight
                } else if (t.isMandatory) { weightSum += weight }
            })
            return weightSum > 0 ? weightedSum / weightSum : 0
        }

        const pScore = calcDimScore('Process')
        const sScore = calcDimScore('Skills')
        const cScore = calcDimScore('Communication')
        const oScore = (pScore * scoreWeights.process + sScore * scoreWeights.skills + cScore * scoreWeights.comm) / 100

        const tagAvgs = new Map<string, number>()
        tMap.forEach((scores, code) => tagAvgs.set(code, scores.reduce((a, b) => a + b, 0) / scores.length))

        results.push({
            id: agentId,
            name: agentNameMap.get(agentId) || agentId.slice(-4),
            totalDeals: dStat.total,
            wonCount: dStat.won,
            winRate: (dStat.won / dStat.total) * 100,
            processScore: pScore,
            skillsScore: sScore,
            commScore: cScore,
            overallScore: oScore,
            tagAvgScores: tagAvgs
        })
    }

    // 3. Correlation calculation
    function calculateR(data: any[], xKey: (d: any) => number, yKey: (d: any) => number) {
        const n = data.length
        if (n < 2) return 0
        const x = data.map(xKey), y = data.map(yKey)
        const sumX = x.reduce((a, b) => a + b, 0), sumY = y.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((p, c, i) => p + c * y[i], 0)
        const sumX2 = x.reduce((a, b) => a + b * b, 0), sumY2 = y.reduce((a, b) => a + b * b, 0)
        const num = n * sumXY - sumX * sumY
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
        return den === 0 ? 0 : num / den
    }

    console.log(`📊 Analyzed ${results.length} valid agents.\n`)
    console.log('📈 Dimension Correlations:')
    const dimCorrs = [
        { label: 'Overall Score', r: calculateR(results, d => d.overallScore, d => d.winRate) },
        { label: 'Process Dimension', r: calculateR(results, d => d.processScore, d => d.winRate) },
        { label: 'Skills Dimension', r: calculateR(results, d => d.skillsScore, d => d.winRate) },
        { label: 'Comm Dimension', r: calculateR(results, d => d.commScore, d => d.winRate) }
    ]
    dimCorrs.forEach(c => console.log(`- ${c.label.padEnd(18)}: ${c.r.toFixed(4)}`))

    console.log('\n📈 Top Tag Correlations (with Win Rate):')
    const tagCorrs = allTags.map(tag => {
        const agentsWithTag = results.filter(r => r.tagAvgScores.has(tag.code))
        if (agentsWithTag.length < 5) return { name: tag.name, r: 0, sample: agentsWithTag.length }
        return { name: tag.name, r: calculateR(agentsWithTag, d => d.tagAvgScores.get(tag.code)!, d => d.winRate), sample: agentsWithTag.length }
    }).sort((a, b) => b.r - a.r)

    console.log('--- Positives ---')
    tagCorrs.filter(t => t.r > 0).slice(0, 10).forEach(t => console.log(`${t.name.padEnd(20)} | ${t.r.toFixed(4).padStart(11)} | n=${t.sample}`))
    console.log('--- Negatives ---')
    tagCorrs.filter(t => t.r < 0).reverse().slice(0, 10).reverse().forEach(t => console.log(`${t.name.padEnd(20)} | ${t.r.toFixed(4).padStart(11)} | n=${t.sample}`))
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
