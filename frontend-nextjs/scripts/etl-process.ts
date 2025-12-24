/**
 * ETL Process Script
 * 
 * 批量处理 ai_analysis_logs 表中的数据，
 * 将 signal_events 写入 call_signals 表，
 * 将 tags 写入 call_tags 表。
 * 
 * 使用核心 ETL 模块 (src/lib/etl.ts) 进行处理。
 * 
 * Usage: npx tsx scripts/etl-process.ts
 */

import fs from 'fs'
import path from 'path'
import prisma from '../src/lib/prisma'
import {
  parseAnalysisJsonVerbose,
  processCallAnalysis,
  ETLInput,
  ETLResult
} from '../src/lib/etl'

// 解析失败记录类型
interface ParseFailure {
  logId: string
  dealId: string | null
  agentId: string | null
  error: string
  rawSignals: string
  timestamp: string
}

interface Deal {
  id: string
  outcome: string
  createdAt: string
}

async function runETL() {
  console.log('='.repeat(60))
  console.log('Starting ETL Process...')
  console.log('='.repeat(60))

  // 1. Load Deals Map (ID -> Outcome, CreatedAt)
  const allDeals = await prisma.deal.findMany({
    select: { id: true, outcome: true, createdAt: true }
  })
  const dealOutcomeMap = new Map<string, string>()
  const dealCreatedAtMap = new Map<string, string>()
  allDeals.forEach(d => {
    dealOutcomeMap.set(d.id, d.outcome)
    dealCreatedAtMap.set(d.id, d.createdAt)
  })
  console.log(`Loaded ${allDeals.length} deals for outcome and time lookup.`)

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
  console.log('\nClearing existing calls, tags, and signals...')
  await prisma.promptExecutionLog.deleteMany({})
  await prisma.callTag.deleteMany({})
  await prisma.callSignal.deleteMany({})
  await prisma.call.deleteMany({})
  console.log('  ✓ Cleared existing data.')

  // 3. Load analysis logs
  const logs = await prisma.aIAnalysisLog.findMany()
  console.log(`\nFound ${logs.length} analysis logs to process.`)

  // 4. Process each log
  const results: ETLResult[] = []
  const allMissingTagCodes = new Set<string>()
  const parseFailures: ParseFailure[] = []  // 收集解析失败的记录
  const allAnomalies: any[] = []           // 收集 AI 手抖记录 (Jitters)

  console.log('\nProcessing logs...')
  console.log('-'.repeat(60))

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    const callId = log.dealId

    if (!callId) {
      console.warn(`[${i + 1}/${logs.length}] Log ${log.id} missing dealId, skipping.`)
      continue
    }

    // Parse signals JSON (VERBOSE)
    const parseResult = parseAnalysisJsonVerbose(log.signals)
    if (!parseResult.success || !parseResult.data) {
      // 记录解析失败的详细信息
      parseFailures.push({
        logId: log.id,
        dealId: log.dealId,
        agentId: log.agentId,
        error: parseResult.error || 'Unknown parse error',
        rawSignals: log.signals || '',
        timestamp: new Date().toISOString()
      })
      console.error(`[${i + 1}/${logs.length}] ❌ Parse failed: logId=${log.id}, dealId=${log.dealId} - ${parseResult.error}`)
      continue
    }

    const analysisResult = parseResult.data

    // Prepare ETL input
    // 使用 Deal 的 createdAt 作为通话时间（而不是 AI 分析时间）
    const outcome = dealOutcomeMap.get(callId) || 'unknown'
    const dealCreatedAt = dealCreatedAtMap.get(callId) || log.createdAt
    const audioUrl = audioMap.get(callId) || ''

    const input: ETLInput = {
      callId: callId,
      agentId: log.agentId || 'unknown',
      outcome: outcome,
      audioUrl: audioUrl,
      createdAt: dealCreatedAt, // 使用工单创建时间，不是 AI 分析时间
      analysisResult: analysisResult
    }

    // Process using core ETL module (now async)
    const result = await processCallAnalysis(input, {
      createCall: true,
      clearExisting: false // We already cleared all data above
    })

    results.push(result)

    // 收集手抖记录
    if (result.anomalies.length > 0) {
      allAnomalies.push({
        dealId: callId,
        anomalies: result.anomalies
      })
    }

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
  const totalTags = results.reduce((sum, r) => sum + r.insertedTags, 0)

  console.log(`\nSummary:`)
  console.log(`  - Total Logs Processed: ${results.length}`)
  console.log(`  - Successful: ${successCount}`)
  console.log(`  - Failed: ${failedCount}`)
  console.log(`  - Total Signals Inserted: ${totalSignals}`)
  console.log(`  - Total Tags Inserted: ${totalTags}`)
  console.log(`  - Parse Failures: ${parseFailures.length}`)
  console.log(`  - AI Jitters (Anomalies): ${allAnomalies.length}`)

  if (allMissingTagCodes.size > 0) {
    console.log(`\n⚠️  Warning: The following tag codes were not found in the database:`)
    console.log(`    ${Array.from(allMissingTagCodes).join(', ')}`)
  }

  // 写入解析失败日志文件
  if (parseFailures.length > 0) {
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logFileName = `etl-parse-failures-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const logFilePath = path.join(logDir, logFileName)
    fs.writeFileSync(logFilePath, JSON.stringify(parseFailures, null, 2))
    console.log(`\n📁 Parse failure log saved to: ${logFilePath}`)
  }

  // 写入 AI 手抖日志文件
  if (allAnomalies.length > 0) {
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logFileName = `ai-jitters-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const logFilePath = path.join(logDir, logFileName)
    fs.writeFileSync(logFilePath, JSON.stringify(allAnomalies, null, 2))
    console.log(`\n🛡️  AI Jitters log saved to: ${logFilePath}`)
  }

  // 6. Verify results
  console.log('\n' + '-'.repeat(60))
  console.log('Verification:')
  const callCount = await prisma.call.count()
  const signalCount = await prisma.callSignal.count()
  const tagCount = await prisma.callTag.count()

  console.log(`  - Calls in DB: ${callCount}`)
  console.log(`  - Signals in DB: ${signalCount}`)
  console.log(`  - Tags in DB: ${tagCount}`)
  console.log('-'.repeat(60))

  await prisma.$disconnect()
}

// Run ETL
runETL().catch(console.error)
