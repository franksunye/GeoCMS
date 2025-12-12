/**
 * Batch Re-analyze Script
 * 
 * 批量重新分析已有的通话记录，使用指定的 Prompt。
 * 
 * Usage: npx tsx scripts/batch-reanalyze.ts
 */

import prisma from '../src/lib/prisma';
import { analyzeCall } from '../src/lib/ai-service';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const PROMPT_ID = '516b7f96-fe05-4d63-b342-d49b698ea4cb'; // The prompt you specified
const BATCH_LIMIT = 5; // Test with 5 calls first

async function runBatch() {
    console.log(`Starting Batch Re-analysis using Prompt ID: ${PROMPT_ID}`);
    console.log(`Limit: ${BATCH_LIMIT} calls`);

    // 1. Get Prompt Content
    const promptRecord = await prisma.prompt.findUnique({
        where: { id: PROMPT_ID },
        select: { content: true }
    });

    if (!promptRecord) {
        console.error('Prompt not found!');
        process.exit(1);
    }
    const promptContent = promptRecord.content;
    console.log('Prompt loaded successfully.');

    // 2. Get Calls to Process (Only those that already exist in analysis logs)
    // Get calls that have analysis logs
    const logsWithCalls = await prisma.aIAnalysisLog.findMany({
        select: { dealId: true }
    });
    const callIds = [...new Set(logsWithCalls.map(l => l.dealId).filter((id): id is string => id !== null))];

    const calls = await prisma.call.findMany({
        where: { id: { in: callIds } },
        orderBy: { startedAt: 'desc' },
        select: { id: true, startedAt: true }
    });

    console.log(`Found ${calls.length} calls to process.`);

    // 3. Process Loop
    let successCount = 0;
    let failCount = 0;

    for (const [index, call] of calls.entries()) {
        const callId = call.id;
        console.log(`[${index + 1}/${calls.length}] Processing Call ${callId} (${call.startedAt})...`);

        try {
            // Analyzing call (Real run, not ping)
            const result = await analyzeCall(callId, promptContent, false);

            if (result.isMock) {
                console.warn(`  ⚠️  Result is MOCK data (Network/API Error: ${result.networkError})`);
                failCount++;
                continue;
            }

            if (result.parseError) {
                console.error(`  ❌  JSON Parse Error: ${result.parseError}`);
                failCount++;
                continue;
            }

            console.log(`  ✅  Analysis Success (${result.executionTime}ms)`);

            // 4. Update Database
            const now = new Date().toISOString();

            await prisma.$transaction(async (tx) => {
                // Update existing log
                const updateResult = await tx.aIAnalysisLog.updateMany({
                    where: { dealId: callId },
                    data: {
                        signals: JSON.stringify(result.parsedOutput),
                        createdAt: now
                    }
                });

                if (updateResult.count === 0) {
                    console.warn(`  ⚠️  Record disappeared? Update skipped.`);
                }

                // Log execution history
                await tx.promptExecutionLog.create({
                    data: {
                        id: uuidv4(),
                        promptId: PROMPT_ID,
                        callId: callId,
                        inputVariables: JSON.stringify(result.replacements.map(r => r.variable)),
                        rawOutput: result.rawOutput,
                        parsedOutput: JSON.stringify(result.parsedOutput),
                        executionTimeMs: result.executionTime,
                        status: 'success_batch',
                        errorMessage: null,
                        isDryRun: 0,
                        createdAt: now
                    }
                });
            });

            console.log(`  💾  Saved to DB`);
            successCount++;

        } catch (e: any) {
            console.error(`  ❌  Error: ${e.message}`);
            failCount++;
        }
    }

    console.log('\n--- Batch Complete ---');
    console.log(`Total: ${calls.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

    await prisma.$disconnect();
}

runBatch();
