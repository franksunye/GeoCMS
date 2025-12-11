import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // 1. Fetch Calls that have analysis logs
        const calls = db.prepare(`
        SELECT 
            c.id, 
            c.startedAt, 
            c.agentId, 
            a.name as agentName,
            (SELECT COUNT(*) FROM call_signals WHERE callId = c.id) as signalCount,
            (SELECT COUNT(*) FROM call_assessments WHERE callId = c.id) as tagCount
        FROM calls c
        LEFT JOIN agents a ON c.agentId = a.id
        WHERE c.id IN (SELECT DISTINCT callId FROM call_assessments)
        ORDER BY c.startedAt DESC
        LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];

        // 2. For each call, fetch Signals and Tags to perform consistency check
        const auditData = calls.map(call => {
            const signals = db.prepare(`
            SELECT id, signalCode, context_text, timestamp_sec, confidence 
            FROM call_signals 
            WHERE callId = ?
        `).all(call.id) as any[];

            const tags = db.prepare(`
            SELECT 
                t.code as tagCode, 
                ca.score,
                ca.context_text,
                ca.context_events, 
                ca.confidence
            FROM call_assessments ca
            JOIN tags t ON ca.tagId = t.id
            WHERE ca.callId = ?
        `).all(call.id) as any[];

            // Perform Consistency Analysis
            const analysis = tags.map((tag: any) => {
                // A. Count expected signals (Raw Signals matching this Tag Code)
                const matchedSignals = signals.filter(s => s.signalCode === tag.tagCode);

                // B. Count aggregated events (From Tag's JSON context)
                let aggregatedEvents = [];
                try {
                    aggregatedEvents = tag.context_events ? JSON.parse(tag.context_events) : [];
                } catch (e) {
                    // Fallback to split string if JSON fails
                    if (tag.context_text) {
                        aggregatedEvents = tag.context_text.split(' | ').filter((t: string) => t.trim().length > 0);
                    }
                }

                // C. Compare
                const signalCount = matchedSignals.length;
                const eventCount = aggregatedEvents.length;
                const diff = signalCount - eventCount;

                return {
                    tagCode: tag.tagCode,
                    score: tag.score,
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
            // For Audit view, we likely want to see "Issues"
            const issues = analysis.filter(a => a.status !== 'ok');

            return {
                ...call,
                totalConsistencyScore: Math.round(((tags.length - issues.length) / (tags.length || 1)) * 100),
                issuesCount: issues.length,
                analysis
            };
        });

        return NextResponse.json({
            data: auditData,
            pagination: { limit, offset }
        });

    } catch (error) {
        console.error('Error fetching AI audit data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
