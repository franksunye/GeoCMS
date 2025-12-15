/**
 * ETL Process Script
 * 
 * 批量处理 ai_analysis_logs 表中的数据，
 * 将 signal_events 写入 call_signals 表，
 * 将 tags 写入 call_assessments 表。
 * 
 * 使用核心 ETL 模块 (src/lib/etl.ts) 进行处理。
 * 
 * Usage: npx tsx scripts/etl-process.ts
 */

import prisma from '../src/lib/prisma'
import {
  parseAnalysisJson,
  processCallAnalysis,
  ETLInput,
  ETLResult
} from '../src/lib/etl'

interface Deal {
  id: string
  outcome: string
}

async function runETL() {
  console.log('='.repeat(60))
  console.log('Starting ETL Process...')
  console.log('='.repeat(60))

  // 1. Load Deals Map (ID -> Outcome)
  const allDeals = await prisma.deal.findMany({
    select: { id: true, outcome: true }
  })
  const dealMap = new Map<string, string>()
  allDeals.forEach(d => dealMap.set(d.id, d.outcome))
  console.log(`Loaded ${dealMap.size} deals for outcome lookup.`)

  // 1.1 Load Transcripts Map (dealId -> audioUrl)
  const allTranscripts = await prisma.transcript.findMany({
    select: { dealId: true, audioUrl: true }
  })
  const audioMap = new Map<string, string>()
  allTranscripts.forEach(t => {
    if (t.audioUrl) audioMap.set(t.dealId, t.audioUrl)
  })
  console.log(`Loaded ${audioMap.size} audio URLs from transcripts.`)

  // 2. Clear existing data
  console.log('\nClearing existing calls, assessments, and signals...')
  await prisma.callAssessment.deleteMany({})
  await prisma.callSignal.deleteMany({})
  await prisma.call.deleteMany({})
  console.log('  ✓ Cleared existing data.')

  // 3. Load analysis logs
  const logs = await prisma.aIAnalysisLog.findMany()
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
    const audioUrl = audioMap.get(callId) || ''
    
    const input: ETLInput = {
      callId: callId,
      agentId: log.agentId || 'unknown',
      outcome: outcome,
      audioUrl: audioUrl,
      createdAt: log.createdAt,
      analysisResult: analysisResult
    }

    // Process using core ETL module (now async)
    const result = await processCallAnalysis(input, {
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
  const callCount = await prisma.call.count()
  const signalCount = await prisma.callSignal.count()
  const assessmentCount = await prisma.callAssessment.count()

  console.log(`  - Calls in DB: ${callCount}`)
  console.log(`  - Signals in DB: ${signalCount}`)
  console.log(`  - Assessments in DB: ${assessmentCount}`)
  console.log('-'.repeat(60))

  await prisma.$disconnect()
}

// Run ETL
runETL().catch(console.error)
