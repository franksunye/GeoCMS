import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { analyzeCall } from '@/lib/ai-service';

// POST: Execute a prompt (test run or actual run)
export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let isMock = false;
    let networkError = null;

    try {
        const body = await request.json();
        const { promptId, promptContent, callId, dryRun = true, ping = false } = body;

        // 1. Get prompt content
        let finalPromptContent = promptContent;
        if (promptId) {
            const promptRecord = db.prepare('SELECT * FROM prompts WHERE id = ?').get(promptId);
            if (promptRecord && typeof promptRecord === 'object' && 'content' in promptRecord) {
                finalPromptContent = (promptRecord as any).content;
            }
        }

        // Validation for Non-Ping or Ping-with-Preview
        if (!finalPromptContent && !ping) {
            return NextResponse.json({ error: 'Either promptId or promptContent is required' }, { status: 400 });
        }

        if (!callId && !ping) {
            // Basic ping allows no callId if just checking API connectivity without variables
            // But if we ever want to handle "PING" purely for API check, we can skip analyzeCall entirely or make analyzeCall robust.
            // Given our current analyzeCall requires CallId to fetch transcript, we enforce CallId except for a pure connectivity ping?
            // Actually, analyzeCall throws error if CallId not found.
            // Let's enforce callId unless it's a "Simple Ping" (which we haven't strictly defined, usually UI sends callId).
            // If UI sends ping=true without callId, it might crash analyzeCall.
            // Let's just say for now: callId is required for consistency.
            return NextResponse.json({ error: 'callId is required for analysis context' }, { status: 400 });
        }

        // 2. Call AI Service
        let analysisResult;
        try {
            // If ping is strictly connectivity check, we might want to bypass DB fetch if callId is missing.
            // But assume UI always provides callId.
            analysisResult = await analyzeCall(callId || 'dummy', finalPromptContent || '', ping);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }

        const {
            rawOutput, parsedOutput, preparedPrompt, replacements,
            isMock: serviceIsMock, networkError: serviceNetworkError, parseError, executionTime
        } = analysisResult;

        isMock = serviceIsMock;
        networkError = serviceNetworkError;

        // 3. Log execution (Audit Log)
        const logId = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO prompt_execution_logs (
                id, promptId, callId, input_variables, raw_output, parsed_output, 
                execution_time_ms, status, error_message, is_dry_run, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            logId,
            promptId || 'inline',
            callId,
            JSON.stringify(replacements.map(r => r.variable)),
            rawOutput,
            parsedOutput ? JSON.stringify(parsedOutput) : null,
            // Re-calculate total execution time or use service time? Service time is cleaner.
            executionTime,
            parseError ? 'parse_error' : (isMock ? 'success_mock' : 'success'),
            networkError ? `Network Error (Fallback Used): ${networkError}` : parseError,
            dryRun ? 1 : 0,
            now
        );

        // 4. Update Business Data (IfNot dryRun)
        if (!dryRun && parsedOutput && !parseError && !isMock && !ping) {
            db.prepare('DELETE FROM ai_analysis_logs WHERE dealId = ?').run(callId);
            db.prepare(`
                INSERT INTO ai_analysis_logs (id, dealId, signals, createdAt)
                VALUES (?, ?, ?, ?)
            `).run(uuidv4(), callId, JSON.stringify(parsedOutput), now);
        }

        return NextResponse.json({
            success: true,
            logId,
            executionTime,
            dryRun,
            rawOutput,
            parsedOutput,
            parseError,
            replacements,
            preparedPrompt,
            isMock,
            networkError,
            output: rawOutput // For compatibility with ping UI
        });

    } catch (error) {
        console.error('Error executing prompt:', error);
        return NextResponse.json({
            error: 'Prompt execution failed',
            details: String(error)
        }, { status: 500 });
    }
}

// GET: Get execution logs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const promptId = searchParams.get('promptId');
        const callId = searchParams.get('callId');
        const limit = parseInt(searchParams.get('limit') || '20');

        let sql = 'SELECT * FROM prompt_execution_logs WHERE 1=1';
        const params: any[] = [];

        if (promptId) {
            sql += ' AND promptId = ?';
            params.push(promptId);
        }

        if (callId) {
            sql += ' AND callId = ?';
            params.push(callId);
        }

        sql += ' ORDER BY createdAt DESC LIMIT ?';
        params.push(limit);

        const logs = db.prepare(sql).all(...params);

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching execution logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
