import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStorageUrl } from '@/lib/storage';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // 1. Fetch Calls that have analysis logs
        const calls = await prisma.call.findMany({
            where: {
                assessments: { some: {} } // Only calls that have assessments
            },
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
                        assessments: true
                    }
                }
            },
            orderBy: { startedAt: 'desc' },
            take: limit,
            skip: offset
        });

        // 2. For each call, fetch Signals and Tags to perform consistency check
        const auditData = await Promise.all(calls.map(async (call) => {
            const signals = await prisma.callSignal.findMany({
                where: { callId: call.id },
                select: {
                    id: true,
                    signalCode: true,
                    contextText: true,
                    timestampSec: true,
                    confidence: true
                }
            });

            const tags = await prisma.callAssessment.findMany({
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
            const analysis = tags.map((tagAssessment) => {
                const tagCode = tagAssessment.tag.code;

                // A. Count expected signals (Raw Signals matching this Tag Code)
                const matchedSignals = signals.filter(s => s.signalCode === tagCode);

                // B. Count aggregated events (From Tag's JSON context)
                let aggregatedEvents: any[] = [];
                try {
                    aggregatedEvents = tagAssessment.contextEvents
                        ? JSON.parse(tagAssessment.contextEvents)
                        : [];
                } catch (e) {
                    // Fallback to split string if JSON fails
                    if (tagAssessment.contextText) {
                        aggregatedEvents = tagAssessment.contextText
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
                    score: tagAssessment.score,
                    signalCount,
                    eventCount,
                    diff,
                    status: diff === 0 ? 'ok' : (diff > 0 ? 'missing_aggregation' : 'extra_aggregation'),
                    details: {
                        signals: matchedSignals,
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
                tagCount: call._count.assessments,
                totalConsistencyScore: Math.round(((tags.length - issues.length) / (tags.length || 1)) * 100),
                issuesCount: issues.length,
                analysis
            };
        }));

        return NextResponse.json({
            data: auditData,
            pagination: { limit, offset }
        });

    } catch (error) {
        console.error('Error fetching AI audit data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
