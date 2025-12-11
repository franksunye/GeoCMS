/**
 * ETL Process Script
 * 
 * 批量处理 ai_analysis_logs 表中的数据，
 * 将 signal_events 写入 call_signals 表，
 * 将 tags 写入 call_assessments 表。
 * 
 * 使用核心 ETL 模块 (src/lib/etl.ts) 进行处理。
 * 
 * Usage: npx ts-node scripts/etl-process.ts
 */

import db from '@/lib/db'
import {
  parseAnalysisJson,
  processCallAnalysis,
  ETLInput,
  ETLResult
} from '@/lib/etl'

interface AnalysisLog {
  id: string
  dealId: string
  signals: string // JSON string
  createdAt: string
  agentId: string | null
  teamId: string | null
}

interface Deal {
  id: string
  outcome: string
}

function runETL() {
  console.log('='.repeat(60))
  console.log('Starting ETL Process...')
  console.log('='.repeat(60))

  // Disable FKs for ETL
  db.pragma('foreign_keys = OFF')

  // 1. Load Deals Map (ID -> Outcome)
  const allDeals = db.prepare('SELECT id, outcome FROM deals').all() as Deal[]
  const dealMap = new Map<string, string>()
  allDeals.forEach(d => dealMap.set(d.id, d.outcome))
  console.log(`Loaded ${dealMap.size} deals for outcome lookup.`)

  // 2. Clear existing data
  console.log('\nClearing existing calls, assessments, and signals...')
  db.prepare('DELETE FROM call_assessments').run()
  db.prepare('DELETE FROM call_signals').run()
  db.prepare('DELETE FROM calls').run()
  console.log('  ✓ Cleared existing data.')

  // 3. Load analysis logs
  const logs = db.prepare('SELECT * FROM ai_analysis_logs').all() as AnalysisLog[]
  console.log(`\nFound ${logs.length} analysis logs to process.`)

  // 4. Process each log
  const results: ETLResult[] = []
  const allMissingTagCodes = new Set<string>()

  console.log('\nProcessing logs...')
  console.log('-'.repeat(60))

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    const callId = log.dealId

    if (!callId) {
      console.warn(`[${i + 1}/${logs.length}] Log ${log.id} missing dealId, skipping.`)
      continue
    }

    // Parse signals JSON
    const analysisResult = parseAnalysisJson(log.signals)
    if (!analysisResult) {
      console.error(`[${i + 1}/${logs.length}] Failed to parse signals for log ${log.id}`)
      continue
    }

    // Prepare ETL input
    const outcome = dealMap.get(callId) || 'unknown'
    const input: ETLInput = {
      callId: callId,
      agentId: log.agentId || 'unknown',
      outcome: outcome,
      createdAt: log.createdAt,
      analysisResult: analysisResult
    }

    // Process using core ETL module
    const result = processCallAnalysis(input, {
      createCall: true,
      clearExisting: false // We already cleared all data above
    })

    results.push(result)

    // Collect missing tag codes
    result.missingTagCodes.forEach(code => allMissingTagCodes.add(code))

    // Progress indicator
    if ((i + 1) % 5 === 0 || i === logs.length - 1) {
      console.log(`  Processed ${i + 1}/${logs.length} logs...`)
    }
  }

  // 5. Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('ETL Process Completed!')
  console.log('='.repeat(60))

  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length
  const totalSignals = results.reduce((sum, r) => sum + r.insertedSignals, 0)
  const totalAssessments = results.reduce((sum, r) => sum + r.insertedAssessments, 0)

  console.log(`\nSummary:`)
  console.log(`  - Total Logs Processed: ${results.length}`)
  console.log(`  - Successful: ${successCount}`)
  console.log(`  - Failed: ${failedCount}`)
  console.log(`  - Total Signals Inserted: ${totalSignals}`)
  console.log(`  - Total Assessments Inserted: ${totalAssessments}`)

  if (allMissingTagCodes.size > 0) {
    console.log(`\n⚠️  Warning: The following tag codes were not found in the database:`)
    console.log(`    ${Array.from(allMissingTagCodes).join(', ')}`)
  }

  // 6. Verify results
  console.log('\n' + '-'.repeat(60))
  console.log('Verification:')
  const callCount = (db.prepare('SELECT COUNT(*) as cnt FROM calls').get() as { cnt: number }).cnt
  const signalCount = (db.prepare('SELECT COUNT(*) as cnt FROM call_signals').get() as { cnt: number }).cnt
  const assessmentCount = (db.prepare('SELECT COUNT(*) as cnt FROM call_assessments').get() as { cnt: number }).cnt

  console.log(`  - Calls in DB: ${callCount}`)
  console.log(`  - Signals in DB: ${signalCount}`)
  console.log(`  - Assessments in DB: ${assessmentCount}`)
  console.log('-'.repeat(60))
}

// Run ETL
runETL()
