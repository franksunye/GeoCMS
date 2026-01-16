import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { analyzeCall } from '@/lib/ai-service';

// POST: Execute a prompt (test run or actual run)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { promptId, promptContent, callId, dryRun = true, ping = false } = body;

        // 1. Get prompt content
        let finalPromptContent = promptContent;
        if (promptId) {
            const promptRecord = await prisma.prompt.findUnique({
                where: { id: promptId },
                select: { content: true }
            });
            if (promptRecord) {
                finalPromptContent = promptRecord.content;
            }
        }

        // Validation for Non-Ping or Ping-with-Preview
        if (!finalPromptContent && !ping) {
            return NextResponse.json({ error: 'Either promptId or promptContent is required' }, { status: 400 });
        }

        if (!callId && !ping) {
            return NextResponse.json({ error: 'callId is required for analysis context' }, { status: 400 });
        }

        // 2. Call AI Service
        let analysisResult;
        try {
            analysisResult = await analyzeCall(callId || 'dummy', finalPromptContent || '', ping);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }

        const {
            rawOutput, parsedOutput, preparedPrompt, replacements,
            isMock: serviceIsMock, networkError: serviceNetworkError, parseError, executionTime
        } = analysisResult;

        const isMock = serviceIsMock;
        const networkError = serviceNetworkError;

        // 3. Log execution (Audit Log)
        const logId = uuidv4();
        const now = new Date().toISOString();

        await prisma.promptExecutionLog.create({
            data: {
                id: logId,
                promptId: promptId || 'inline',
                callId: callId,
                inputVariables: JSON.stringify(replacements.map((r: any) => r.variable)),
                rawOutput: rawOutput,
                parsedOutput: parsedOutput ? JSON.stringify(parsedOutput) : null,
                executionTimeMs: executionTime,
                status: parseError ? 'parse_error' : (isMock ? 'success_mock' : 'success'),
                errorMessage: networkError ? `Network Error (Fallback Used): ${networkError}` : parseError,
                isDryRun: dryRun ? 1 : 0,
                createdAt: now,
            }
        });

        // 4. Update Business Data (If Not dryRun)
        if (!dryRun && parsedOutput && !parseError && !isMock && !ping) {
            // Delete existing analysis logs for this call
            await prisma.aIAnalysisLog.deleteMany({
                where: { dealId: callId }
            });

            // Insert new analysis log
            await prisma.aIAnalysisLog.create({
                data: {
                    id: uuidv4(),
                    dealId: callId,
                    signals: JSON.stringify(parsedOutput),
                    createdAt: now,
                }
            });
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

        const where: any = {};
        if (promptId) where.promptId = promptId;
        if (callId) where.callId = callId;

        const logs = await prisma.promptExecutionLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching execution logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
