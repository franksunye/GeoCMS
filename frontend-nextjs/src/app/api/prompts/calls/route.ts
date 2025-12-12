import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get calls list for prompt testing (simplified view)
export async function GET() {
    try {
        const calls = await prisma.call.findMany({
            select: {
                id: true,
                agentId: true,
                startedAt: true,
                duration: true,
                outcome: true,
                agent: {
                    select: { name: true }
                }
            },
            orderBy: { startedAt: 'desc' },
            take: 100
        });

        // Check for transcripts - Prisma doesn't have EXISTS in the same way
        // So we'll fetch transcript counts in a separate query or use raw query
        const callIds = calls.map(c => c.id);

        // Get transcript counts per call
        const transcriptCounts = await prisma.transcript.groupBy({
            by: ['dealId'],
            where: { dealId: { in: callIds } },
            _count: { id: true }
        });

        const transcriptMap = new Map(
            transcriptCounts.map(t => [t.dealId, t._count.id > 0])
        );

        const formattedCalls = calls.map(call => ({
            id: call.id,
            agentId: call.agentId,
            startedAt: call.startedAt,
            duration: call.duration,
            outcome: call.outcome,
            agentName: call.agent.name,
            hasTranscript: transcriptMap.get(call.id) ? 1 : 0
        }));

        return NextResponse.json(formattedCalls);
    } catch (error) {
        console.error('Error fetching calls for prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }
}
