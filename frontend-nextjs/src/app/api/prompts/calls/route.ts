import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Get calls list for prompt testing (simplified view)
export async function GET() {
    try {
        const calls = db.prepare(`
            SELECT 
                c.id,
                c.agentId,
                c.startedAt,
                c.duration,
                c.outcome,
                a.name as agentName,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM transcripts t WHERE t.dealId = c.id) 
                    THEN 1 ELSE 0 
                END as hasTranscript
            FROM calls c
            LEFT JOIN agents a ON c.agentId = a.id
            ORDER BY c.startedAt DESC
            LIMIT 100
        `).all();

        return NextResponse.json(calls);
    } catch (error) {
        console.error('Error fetching calls for prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }
}
