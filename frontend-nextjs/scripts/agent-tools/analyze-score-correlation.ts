const { PrismaClient } = require('../../src/generated/prisma')

const prisma = new PrismaClient()

// Configuration types
interface ScoreConfig {
    processWeight: number
    skillsWeight: number
    communicationWeight: number
}

interface AgentStats {
    id: string
    name: string
    totalCalls: number
    wonCalls: number
    winRate: number
    processScore: number
    skillsScore: number
    commScore: number
    overallScore: number
}

async function main() {
    console.log('🚀 Starting Scorecard Correlation Analysis...\n')

    const startDate = new Date('2025-07-01T00:00:00.000Z')
    const endDate = new Date('2025-08-01T00:00:00.000Z')

    console.log(`📅 Analyzing Data for: July 2025`)

    // 1. Load Configuration
    console.log('⚙️  Loading Scoring Configuration...')

    // 1a. Dimension Weights
    const scoreConfigRaw = await prisma.scoreConfig.findFirst()
    const scoreWeights: ScoreConfig = {
        processWeight: scoreConfigRaw?.processWeight || 30,
        skillsWeight: scoreConfigRaw?.skillsWeight || 50,
        communicationWeight: scoreConfigRaw?.communicationWeight || 20
    }
    console.log(`   Dimension Weights: Process=${scoreWeights.processWeight}%, Skills=${scoreWeights.skillsWeight}%, Comm=${scoreWeights.communicationWeight}%`)

    // 1b. Tag Weights (Scoring Rules)
    const scoringRules = await prisma.scoringRule.findMany({
        where: { active: 1, ruleType: 'TagBased' }
    })
    const tagWeightMap = new Map<string, number>()
    scoringRules.forEach((rule: any) => {
        tagWeightMap.set(rule.tagCode, rule.weight)
    })
    console.log(`   Tag Rules Loaded: ${scoringRules.length} rules active.`)

    // 2. Fetch Data
    console.log('📥 Fetching Calls and Tags...')

    const calls = await prisma.call.findMany({
        where: {
            startedAt: { gte: startDate.toISOString(), lt: endDate.toISOString() }
        },
        select: {
            id: true,
            agentId: true,
            outcome: true
        }
    })

    const agentMap = new Map<string, { total: number, won: number }>()
    calls.forEach((c: any) => {
        if (!agentMap.has(c.agentId)) agentMap.set(c.agentId, { total: 0, won: 0 })
        const stat = agentMap.get(c.agentId)!
        stat.total++
        if (c.outcome === 'won') stat.won++
    })

    // Filter agents with minimal activity (> 5 calls)
    const validAgentIds = Array.from(agentMap.entries())
        .filter(([_, stat]) => stat.total > 5)
        .map(([id, _]) => id)

    console.log(`   Found ${calls.length} calls. Analying ${validAgentIds.length} agents with >5 calls.`)

    // 3. Fetch Tags and Tags scores
    const allTags = await prisma.tag.findMany({
        where: { active: 1 } // Fetch all active tags
    })

    const callTags = await prisma.callTag.findMany({
        where: {
            call: {
                agentId: { in: validAgentIds },
                startedAt: { gte: startDate.toISOString(), lt: endDate.toISOString() }
            }
        },
        include: {
            tag: true,
            call: { select: { agentId: true } }
        }
    })

    // 4. Calculate Scores
    // Group tags by Agent -> Tag ID
    const agentScoresMap = new Map<string, Map<string, number[]>>() // agentId -> Map<tagId, scores[]>

    callTags.forEach((a: any) => {
        const aid = a.call.agentId
        if (!agentScoresMap.has(aid)) agentScoresMap.set(aid, new Map())
        const tagMap = agentScoresMap.get(aid)!

        if (!tagMap.has(a.tag.id)) tagMap.set(a.tag.id, [])
        tagMap.get(a.tag.id)!.push(a.score)
    })

    // Calculate Average per Tag per Agent
    const agentTagAvgMap = new Map<string, Map<string, number>>() // agentId -> Map<tagId, avgScore>
    agentScoresMap.forEach((tagMap, agentId) => {
        const avgMap = new Map<string, number>()
        tagMap.forEach((scores, tagId) => {
            const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length
            avgMap.set(tagId, avg)
        })
        agentTagAvgMap.set(agentId, avgMap)
    })

    // Calculate Dimension Scores & Overall Score
    const results: AgentStats[] = []

    // Helper to map Dimension String to Category (Process/Skills/Comm)
    const getDimensionCategory = (dim: string): string => {
        if (dim === 'Process' || dim === 'Sales.Process') return 'Process'
        if (dim === 'Communication' || dim === 'Sales.Communication') return 'Communication'
        // CRITICAL LOGIC UPDATE: Include Intent and Constraint in Skills
        if (dim === 'Skills' || dim === 'Sales.Skills' || dim === 'Intent' || dim === 'Constraint') return 'Skills'
        return 'Other'
    }

    // Pre-classify tags
    const processTags = allTags.filter((t: any) => getDimensionCategory(t.dimension) === 'Process')
    const skillsTags = allTags.filter((t: any) => getDimensionCategory(t.dimension) === 'Skills')
    const commTags = allTags.filter((t: any) => getDimensionCategory(t.dimension) === 'Communication')

    for (const agentId of validAgentIds) {
        const stats = agentMap.get(agentId)!
        const winRate = (stats.won / stats.total) * 100
        const tagAvgs = agentTagAvgMap.get(agentId) || new Map()

        const calcDimScore = (refTags: typeof allTags) => {
            let weightedSum = 0
            let weightSum = 0

            for (const tag of refTags) {
                const score = tagAvgs.get(tag.id)
                const weight = tagWeightMap.get(tag.code) || 1.0

                if (score !== undefined) {
                    weightedSum += score * weight
                    weightSum += weight
                } else if (tag.isMandatory) {
                    // Missing mandatory tag = 0 score
                    weightSum += weight
                }
            }
            return weightSum > 0 ? (weightedSum / weightSum) : 0
        }

        const processScore = calcDimScore(processTags)
        const skillsScore = calcDimScore(skillsTags)
        const commScore = calcDimScore(commTags)

        const overallScore = (
            processScore * scoreWeights.processWeight +
            skillsScore * scoreWeights.skillsWeight +
            commScore * scoreWeights.communicationWeight
        ) / 100

        results.push({
            id: agentId,
            name: agentId.substring(agentId.length - 4), // Short ID
            totalCalls: stats.total,
            wonCalls: stats.won,
            winRate: winRate,
            processScore,
            skillsScore,
            commScore,
            overallScore
        })
    }

    // 5. Output Results
    console.log('\n📊 Results Sorted by Win Rate (Descending):')
    console.log('Agent | Calls | Win Rate | Overall | Process | Skills | Comm')
    console.log('------+-------+----------+---------+---------+--------+------')

    results.sort((a, b) => b.winRate - a.winRate)

    results.forEach(r => {
        console.log(
            `${r.name}  | ` +
            `${r.totalCalls.toString().padEnd(5)} | ` +
            `${r.winRate.toFixed(1)}%`.padEnd(8) + ' | ' +
            `\x1b[1m${r.overallScore.toFixed(2)}\x1b[0m   | ` +
            `${r.processScore.toFixed(1)}    | ` +
            `${r.skillsScore.toFixed(1)}   | ` +
            `${r.commScore.toFixed(1)}`
        )
    })

    // 6. Calculate Correlation
    if (results.length > 1) {
        const n = results.length
        const sumX = results.reduce((s, a) => s + a.overallScore, 0)
        const sumY = results.reduce((s, a) => s + a.winRate, 0)
        const sumXY = results.reduce((s, a) => s + a.overallScore * a.winRate, 0)
        const sumX2 = results.reduce((s, a) => s + a.overallScore ** 2, 0)
        const sumY2 = results.reduce((s, a) => s + a.winRate ** 2, 0)

        const numerator = n * sumXY - sumX * sumY
        const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))
        const r = denominator !== 0 ? numerator / denominator : 0

        console.log('\n📈 Statistical Analysis:')

        // Colorize output based on correlation strength
        let color = '\x1b[31m' // Red
        if (r > 0.3) color = '\x1b[33m' // Yellow
        if (r > 0.5) color = '\x1b[32m' // Green

        console.log(`Correlation Coefficient (r): ${color}${r.toFixed(4)}\x1b[0m`)

        if (r > 0.7) console.log('Strong Positive Correlation - System Validated ✅')
        else if (r > 0.3) console.log('Moderate Positive Correlation - Direction Correct ☑️')
        else console.log('Weak/No Correlation - Further Optimization Needed ❌')
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
