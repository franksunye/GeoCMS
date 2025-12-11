
import db from '@/lib/db';
import { analyzeCall } from '@/lib/ai-service';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const PROMPT_ID = '516b7f96-fe05-4d63-b342-d49b698ea4cb'; // The prompt you specified
const BATCH_LIMIT = 5; // Test with 5 calls first

async function runBatch() {
    console.log(`Starting Batch Re-analysis using Prompt ID: ${PROMPT_ID}`);
    console.log(`Limit: ${BATCH_LIMIT} calls`);

    // 1. Get Prompt Content
    const promptRecord = db.prepare('SELECT content FROM prompts WHERE id = ?').get(PROMPT_ID) as { content: string };
    if (!promptRecord) {
        console.error('Prompt not found!');
        process.exit(1);
    }
    const promptContent = promptRecord.content;
    console.log('Prompt loaded successfully.');

    // 2. Get Calls to Process (Only those that already exist in analysis logs)
    // We want to RE-analyze existing entries to update their signals with the new prompt.
    const calls = db.prepare(`
        SELECT DISTINCT c.id, c.startedAt 
        FROM calls c
        INNER JOIN ai_analysis_logs l ON c.id = l.dealId
        ORDER BY c.startedAt DESC
        -- LIMIT ? -- Uncomment if you want to limit safe run
    `).all() as { id: string, startedAt: string }[];

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
                // Skip saving mock data for batch runs? usually yes.
            }

            if (result.parseError) {
                console.error(`  ❌  JSON Parse Error: ${result.parseError}`);
                failCount++;
                continue;
            }

            console.log(`  ✅  Analysis Success (${result.executionTime}ms)`);

            // 4. Update Database (ETL)
            // UPDATE existing log to preserve other fields (agentId, teamId, etc.)
            const now = new Date().toISOString();

            // Transaction
            const insert = db.transaction(() => {
                const info = db.prepare(`
                    UPDATE ai_analysis_logs 
                    SET signals = ?, createdAt = ?
                    WHERE dealId = ?
                `).run(JSON.stringify(result.parsedOutput), now, callId);

                if (info.changes === 0) {
                    // Only if it doesn't exist (shouldn't happen in this script logic), insert fresh
                    // But we need to be careful about missing fields. For now, log warning.
                    console.warn(`  ⚠️  Record disappeared? Insert logic skipped to avoid data loss.`);
                }

                // Optional: Log execution history
                db.prepare(`
                    INSERT INTO prompt_execution_logs (
                        id, promptId, callId, input_variables, raw_output, parsed_output, 
                        execution_time_ms, status, error_message, is_dry_run, createdAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    uuidv4(),
                    PROMPT_ID,
                    callId,
                    JSON.stringify(result.replacements.map(r => r.variable)),
                    result.rawOutput,
                    JSON.stringify(result.parsedOutput),
                    result.executionTime,
                    'success_batch',
                    null,
                    0, // Not dry run
                    now
                );
            });

            insert();
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
}

runBatch();
