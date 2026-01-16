import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStorageUrl } from '@/lib/storage';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

        // Filter parameters
        const agentId = searchParams.get('agentId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build where clause
        const whereClause: any = {
            tags: { some: {} } // Only calls that have tags
        };

        // Add agent filter
        if (agentId && agentId !== 'all') {
            whereClause.agentId = agentId;
        }

        // Add date range filter
        if (startDate || endDate) {
            whereClause.startedAt = {};
            if (startDate) {
                whereClause.startedAt.gte = new Date(startDate);
            }
            if (endDate) {
                // Include the entire end date by setting time to end of day
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                whereClause.startedAt.lte = endDateTime;
            }
        }

        // Get total count for pagination
        const total = await prisma.call.count({ where: whereClause });
        const totalPages = Math.ceil(total / pageSize);
        const skip = (page - 1) * pageSize;

        // 1. Fetch Calls that have analysis logs
        const calls = await prisma.call.findMany({
            where: whereClause,
            select: {
                id: true,
                startedAt: true,
                agentId: true,
                duration: true,
                audioUrl: true,
                agent: { select: { name: true } },
                _count: {
                    select: {
                        signals: true,
                        tags: true
                    }
                }
            },
            orderBy: { startedAt: 'desc' },
            take: pageSize,
            skip: skip
        });

        // 2. For each call, fetch Signals and Tags to perform consistency check
        const auditData = await Promise.all(calls.map(async (call) => {
            const signals = await prisma.callSignal.findMany({
                where: { callId: call.id },
                select: {
                    id: true,
                    signalId: true,
                    contextText: true,
                    timestampSec: true,
                    confidence: true,
                    signal: { select: { code: true, name: true } }
                }
            });

            const callTags = await prisma.callTag.findMany({
                where: { callId: call.id },
                select: {
                    score: true,
                    contextText: true,
                    contextEvents: true,
                    confidence: true,
                    tag: { select: { code: true } }
                }
            });

            // Perform Consistency Analysis
            const analysis = callTags.map((callTagScore) => {
                const tagCode = callTagScore.tag.code;

                // A. Count expected signals (Raw Signals matching this Tag Code)
                const matchedSignals = signals.filter(s => s.signal.code === tagCode);

                // B. Count aggregated events (From Tag's JSON context)
                let aggregatedEvents: any[] = [];
                try {
                    aggregatedEvents = callTagScore.contextEvents
                        ? JSON.parse(callTagScore.contextEvents)
                        : [];
                } catch (e) {
                    // Fallback to split string if JSON fails
                    if (callTagScore.contextText) {
                        aggregatedEvents = callTagScore.contextText
                            .split(' | ')
                            .filter((t: string) => t.trim().length > 0);
                    }
                }

                // C. Compare
                const signalCount = matchedSignals.length;
                const eventCount = aggregatedEvents.length;
                const diff = signalCount - eventCount;

                return {
                    tagCode,
                    score: callTagScore.score,
                    signalCount,
                    eventCount,
                    diff,
                    status: diff === 0 ? 'ok' : (diff > 0 ? 'missing_aggregation' : 'extra_aggregation'),
                    details: {
                        signals: matchedSignals.map(s => ({
                            id: s.id,
                            signalCode: s.signal.code,
                            contextText: s.contextText,
                            timestampSec: s.timestampSec,
                            confidence: s.confidence
                        })),
                        events: aggregatedEvents
                    }
                };
            });

            // Filter only problematic tags if needed, or return all
            const issues = analysis.filter(a => a.status !== 'ok');

            return {
                id: call.id,
                startedAt: call.startedAt,
                agentId: call.agentId,
                agentName: call.agent.name,
                duration: call.duration || 0,
                audioUrl: getStorageUrl(call.audioUrl),
                signalCount: call._count.signals,
                tagCount: call._count.tags,
                totalConsistencyScore: Math.round(((callTags.length - issues.length) / (callTags.length || 1)) * 100),
                issuesCount: issues.length,
                analysis
            };
        }));

        return NextResponse.json({
            data: auditData,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
                hasMore: page < totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching AI audit data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
