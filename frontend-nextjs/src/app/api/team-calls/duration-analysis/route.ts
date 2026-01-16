import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('DurationAnalysis')

export async function GET(request: NextRequest) {
    const totalTimer = logger.startTimer('Total Duration Analysis Request')

    try {
        const { searchParams } = new URL(request.url)
        const timeframe = searchParams.get('timeframe') || '30d'
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        let cutoffDate = new Date()
        let endDate: Date | null = null
        cutoffDate.setHours(0, 0, 0, 0)

        if (startDateParam) {
            const parsedStart = new Date(startDateParam)
            if (!isNaN(parsedStart.getTime())) {
                cutoffDate = parsedStart
                cutoffDate.setHours(0, 0, 0, 0)
            }
            if (endDateParam) {
                const parsedEnd = new Date(endDateParam)
                if (!isNaN(parsedEnd.getTime())) {
                    endDate = parsedEnd
                    endDate.setHours(23, 59, 59, 999)
                }
            }
        } else {
            if (timeframe === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7)
            else if (timeframe === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30)
            else if (timeframe === '90d') cutoffDate.setDate(cutoffDate.getDate() - 90)
            else if (timeframe === 'all') cutoffDate = new Date(0)
        }

        const cutoffIso = cutoffDate.toISOString()
        const endIso = endDate ? endDate.toISOString() : new Date().toISOString()

        const callDateFilter = {
            gte: cutoffIso,
            lte: endIso
        }

        const dealDateFilter = {
            gte: cutoffIso,
            lte: endIso
        }

        // 1. Fetch Agents and their Business Metrics (Exactly as Scorecard Page)
        const agentsPromise = prisma.agent.findMany()

        const dealStatsPromise = prisma.deal.groupBy({
            by: ['agentId'],
            where: { createdAt: dealDateFilter },
            _count: { id: true },
        })

        const wonDealStatsPromise = prisma.deal.groupBy({
            by: ['agentId'],
            where: { createdAt: dealDateFilter, outcome: 'won' },
            _count: { id: true },
        })

        const onsiteDealStatsPromise = prisma.deal.groupBy({
            by: ['agentId'],
            where: { createdAt: dealDateFilter, isOnsiteCompleted: 1 },
            _count: { id: true },
        })

        // 2. Fetch Call Data for Duration Distribution
        const callsPromise = prisma.call.findMany({
            where: { startedAt: callDateFilter },
            select: {
                id: true,
                duration: true,
                agentId: true,
                startedAt: true
            }
        })

        const [agents, dealStats, wonStats, onsiteStats, calls] = await Promise.all([
            agentsPromise,
            dealStatsPromise,
            wonDealStatsPromise,
            onsiteDealStatsPromise,
            callsPromise
        ])

        // Build Maps for O(1) access
        const dealCountMap = new Map(dealStats.map(s => [s.agentId, s._count.id]))
        const wonCountMap = new Map(wonStats.map(s => [s.agentId, s._count.id]))
        const onsiteCountMap = new Map(onsiteStats.map(s => [s.agentId, s._count.id]))

        // Fetch outcomes for specific calls to correlate Duration -> Success in the Chart
        const callIds = calls.map(c => c.id)
        const callOutcomeDeals = await prisma.deal.findMany({
            where: { id: { in: callIds } },
            select: { id: true, isOnsiteCompleted: true, outcome: true }
        })
        const callOutcomeMap = new Map(callOutcomeDeals.map(d => [d.id, { onsite: d.isOnsiteCompleted === 1, won: d.outcome === 'won' }]))

        // 3. Aggregate Chart Data (Bucketed Distribution)
        const BUCKET_SIZE = 30
        const MAX_BUCKET = 360
        const buckets: Record<number, { count: number; onsiteCount: number; wonCount: number }> = {}
        for (let i = 0; i <= MAX_BUCKET; i += BUCKET_SIZE) buckets[i] = { count: 0, onsiteCount: 0, wonCount: 0 }

        calls.forEach(call => {
            const duration = call.duration || 0
            const outcome = callOutcomeMap.get(call.id) || { onsite: false, won: false }
            const bucketKey = Math.min(MAX_BUCKET, Math.floor(duration / BUCKET_SIZE) * BUCKET_SIZE)

            if (!buckets[bucketKey]) buckets[bucketKey] = { count: 0, onsiteCount: 0, wonCount: 0 }
            buckets[bucketKey].count++
            if (outcome.onsite) buckets[bucketKey].onsiteCount++
            if (outcome.won) buckets[bucketKey].wonCount++
        })

        const distribution = Object.entries(buckets).map(([sec, data]) => ({
            seconds: parseInt(sec),
            label: parseInt(sec) >= MAX_BUCKET ? `${sec}s+` : `${sec}s`,
            count: data.count,
            onsiteRate: data.count > 0 ? (data.onsiteCount / data.count) * 100 : 0,
            winRate: data.count > 0 ? (data.wonCount / data.count) * 100 : 0
        })).sort((a, b) => a.seconds - b.seconds)

        // 4. Calculate Agent Leaderboard (Consistent with Scorecard)
        const agentStatsMap = new Map<string, { totalDuration: number; callCount: number }>()
        calls.forEach(call => {
            if (!agentStatsMap.has(call.agentId)) agentStatsMap.set(call.agentId, { totalDuration: 0, callCount: 0 })
            const s = agentStatsMap.get(call.agentId)!
            s.totalDuration += call.duration || 0
            s.callCount++
        })

        const agentRankings = agents.map(agent => {
            const stats = agentStatsMap.get(agent.id)
            const totalDeals = dealCountMap.get(agent.id) || 0

            // Skip agents with no activity in this period to keep list relevant
            // Crucial: Only show agents who actually HAVE calls for duration analysis
            if (!stats || stats.callCount === 0) return null

            const wonDeals = wonCountMap.get(agent.id) || 0
            const onsiteDeals = onsiteCountMap.get(agent.id) || 0

            return {
                id: agent.id,
                name: agent.name,
                avgDuration: stats && stats.callCount > 0 ? Math.round(stats.totalDuration / stats.callCount) : 0,
                onsiteRate: totalDeals > 0 ? Math.round((onsiteDeals / totalDeals) * 100) : 0,
                winRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0,
                count: totalDeals // Matches Scorecard 'Total Deals'
            }
        })
            .filter(a => a !== null)
            .sort((a, b) => a!.avgDuration - b!.avgDuration)

        // 5. Global Summary Metrics
        const totalCalls = calls.length
        const avgDuration = totalCalls > 0 ? calls.reduce((sum, c) => sum + (c.duration || 0), 0) / totalCalls : 0
        const compliantCalls = calls.filter(c => (c.duration || 0) <= 150).length
        const complianceRate = totalCalls > 0 ? (compliantCalls / totalCalls) * 100 : 0
        const frictionCalls = calls.filter(c => (c.duration || 0) > 240).length
        const frictionRate = totalCalls > 0 ? (frictionCalls / totalCalls) * 100 : 0

        // Predicted Gain (Efficiency based on Onsite Rate)
        const efficientCalls = calls.filter(c => (c.duration || 0) <= 150)
        const efficientOnsiteRate = efficientCalls.length > 0
            ? efficientCalls.filter(c => callOutcomeMap.get(c.id)?.onsite).length / efficientCalls.length
            : 0
        const inefficientCallsCount = totalCalls - efficientCalls.length
        const currentInefficientOnsiteCount = calls.filter(c => (c.duration || 0) > 150 && callOutcomeMap.get(c.id)?.onsite).length
        const predictedGain = Math.max(0, Math.round((inefficientCallsCount * efficientOnsiteRate) - currentInefficientOnsiteCount))

        totalTimer.end({ count: totalCalls })

        return NextResponse.json({
            summary: {
                avgDuration: Math.round(avgDuration),
                complianceRate: Math.round(complianceRate),
                frictionRate: Math.round(frictionRate),
                predictedGain,
                totalCalls
            },
            distribution,
            agentRankings
        })

    } catch (error) {
        logger.error('Duration analysis failed', { error: String(error) })
        return NextResponse.json({ error: 'Failed to analyze duration' }, { status: 500 })
    }
}
