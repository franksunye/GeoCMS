/**
 * ETL Core Module
 * 
 * 核心 ETL 逻辑，用于处理 AI 分析结果并写入数据库。
 * 这是唯一的 ETL 逻辑维护点，供 API 和脚本共同使用。
 * 
 * 数据流:
 * ai_analysis_logs.signals (JSON) 
 *   → signal_events → call_signals 表
 *   → tags → call_assessments 表
 */

import prisma from './prisma'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// Type Definitions
// ============================================

/**
 * Signal Event - 事件级信号
 * 记录通话中的具体事件："发生了什么"
 */
export interface SignalEvent {
  signal_name: string
  category: string
  dimension: string
  polarity: string
  severity: string | null
  context_text: string
  timestamp_sec: number
  confidence: number
  reasoning: string
}

/**
 * Context Event - 上下文事件
 * Tag 评估中引用的具体文本片段
 */
export interface ContextEvent {
  timestamp_sec: number
  context_text: string
  confidence: number
}

/**
 * Tag Event - 通话级标签
 * 信号的聚合与质量评估："做得好不好"
 */
export interface TagEvent {
  tag: string
  category: string
  dimension: string
  polarity: string
  severity: string | null
  score: number // 1-5 scale
  reasoning: string
  context_events: ContextEvent[]
}

/**
 * AI Analysis Result - AI 分析结果
 * 新格式，包含 signal_events 和 tags
 */
export interface AIAnalysisResult {
  signal_events: SignalEvent[]
  tags: TagEvent[]
}

/**
 * ETL Input - ETL 处理输入
 */
export interface ETLInput {
  callId: string
  agentId?: string
  outcome?: string
  createdAt?: string
  audioUrl?: string
  analysisResult: AIAnalysisResult
}

/**
 * ETL Result - ETL 处理结果
 */
export interface ETLResult {
  success: boolean
  callId: string
  insertedSignals: number
  insertedAssessments: number
  missingTagCodes: string[]
  errors: string[]
}

// ============================================
// Core ETL Functions
// ============================================

/**
 * 解析 AI 分析 JSON 字符串
 * 处理可能包含 markdown 代码块的情况
 */
export function parseAnalysisJson(rawJson: string): AIAnalysisResult | null {
  try {
    let cleaned = rawJson.trim()

    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim()
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim()
    }

    return JSON.parse(cleaned) as AIAnalysisResult
  } catch (error) {
    console.error('Failed to parse analysis JSON:', error)
    return null
  }
}

/**
 * 获取 Tag ID 映射表
 * code -> id
 */
export async function getTagMap(): Promise<Map<string, string>> {
  const allTags = await prisma.tag.findMany({
    select: { id: true, code: true }
  })
  const tagMap = new Map<string, string>()
  allTags.forEach(t => tagMap.set(t.code, t.id))
  return tagMap
}

/**
 * 获取 Signal ID 映射表
 * code -> id
 */
export async function getSignalMap(): Promise<Map<string, string>> {
  const allSignals = await prisma.signal.findMany({
    select: { id: true, code: true }
  })
  const signalMap = new Map<string, string>()
  allSignals.forEach(s => signalMap.set(s.code, s.id))
  return signalMap
}

/**
 * 处理单个通话的 AI 分析结果
 * 
 * @param input ETL 输入数据
 * @param options 选项
 *   - createCall: 是否创建 call 记录（默认 false）
 *   - clearExisting: 是否清除已有的 signals 和 assessments（默认 true）
 */
export async function processCallAnalysis(
  input: ETLInput,
  options: { createCall?: boolean; clearExisting?: boolean } = {}
): Promise<ETLResult> {
  const { callId, agentId, outcome, createdAt, audioUrl, analysisResult } = input
  const { createCall = false, clearExisting = true } = options

  const result: ETLResult = {
    success: false,
    callId,
    insertedSignals: 0,
    insertedAssessments: 0,
    missingTagCodes: [],
    errors: []
  }

  try {
    // Get tag and signal mappings
    const tagMap = await getTagMap()
    const signalMap = await getSignalMap()
    const now = createdAt || new Date().toISOString()

    // Track missing signal codes
    const missingSignalCodes: string[] = []

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Create call record if requested
      if (createCall) {
        await tx.call.upsert({
          where: { id: callId },
          create: {
            id: callId,
            agentId: agentId || 'unknown',
            startedAt: now,
            duration: 300, // Default duration
            outcome: outcome || 'unknown',
            audioUrl: audioUrl || ''
          },
          update: {} // Don't update if exists
        })
      }

      // 2. Clear existing data if requested
      if (clearExisting) {
        await tx.callSignal.deleteMany({ where: { callId } })
        await tx.callAssessment.deleteMany({ where: { callId } })
      }

      // 3. Process Signal Events -> call_signals
      // 使用 signalId 外键关联 cfg_signals (与 tags 模式一致)
      if (analysisResult.signal_events && Array.isArray(analysisResult.signal_events)) {
        for (const signal of analysisResult.signal_events) {
          const signalId = signalMap.get(signal.signal_name)

          if (!signalId) {
            if (!missingSignalCodes.includes(signal.signal_name)) {
              missingSignalCodes.push(signal.signal_name)
            }
            continue // Skip signals not defined in cfg_signals
          }

          try {
            await tx.callSignal.create({
              data: {
                id: `sig_${callId}_${result.insertedSignals}_${Date.now()}`,
                callId: callId,
                signalId: signalId,
                timestampSec: signal.timestamp_sec || null,
                confidence: signal.confidence || 0,
                contextText: signal.context_text || null,
                reasoning: signal.reasoning || null,
                createdAt: now
              }
            })
            result.insertedSignals++
          } catch (e) {
            result.errors.push(`Failed to insert signal ${signal.signal_name}: ${e}`)
          }
        }
      }

      // Log missing signals if any
      if (missingSignalCodes.length > 0) {
        console.warn(`  - Missing Signals: ${missingSignalCodes.join(', ')}`)
      }

      // 4. Process Tags -> call_assessments
      if (analysisResult.tags && Array.isArray(analysisResult.tags)) {
        for (const tag of analysisResult.tags) {
          const tagId = tagMap.get(tag.tag)

          if (!tagId) {
            if (!result.missingTagCodes.includes(tag.tag)) {
              result.missingTagCodes.push(tag.tag)
            }
            continue
          }

          // Convert score 1-5 to 0-100
          const normalizedScore = Math.min(100, Math.max(0, Math.round(tag.score * 20)))

          // Get earliest timestamp from context_events
          let timestamp_sec: number | null = null
          if (tag.context_events && tag.context_events.length > 0) {
            timestamp_sec = Math.min(...tag.context_events.map(e => e.timestamp_sec))
          }

          // Get max confidence from context_events
          let confidence = 0
          if (tag.context_events && tag.context_events.length > 0) {
            confidence = Math.max(...tag.context_events.map(e => e.confidence))
          }

          // Combine context_text from all events
          let context_text: string | null = null
          if (tag.context_events && tag.context_events.length > 0) {
            context_text = tag.context_events.map(e => e.context_text).join(' | ')
          }

          try {
            await tx.callAssessment.create({
              data: {
                id: `assess_${callId}_${tagId}_${Date.now()}`,
                callId: callId,
                tagId: tagId,
                score: normalizedScore,
                confidence: confidence,
                reasoning: tag.reasoning || null,
                contextText: context_text,
                timestampSec: timestamp_sec,
                contextEvents: JSON.stringify(tag.context_events || []),
                createdAt: now
              }
            })
            result.insertedAssessments++
          } catch (e) {
            result.errors.push(`Failed to insert assessment for tag ${tag.tag}: ${e}`)
          }
        }
      }
    })

    result.success = true

    console.log(`ETL Complete for Call ${callId}:`)
    console.log(`  - Inserted Signals: ${result.insertedSignals}`)
    console.log(`  - Inserted Assessments: ${result.insertedAssessments}`)

    if (result.missingTagCodes.length > 0) {
      console.warn(`  - Missing Tags: ${result.missingTagCodes.join(', ')}`)
    }
    if (result.errors.length > 0) {
      console.warn(`  - Errors: ${result.errors.length}`)
    }

  } catch (error) {
    result.errors.push(`Transaction failed: ${error}`)
    console.error('ETL Transaction Failed:', error)
  }

  return result
}

/**
 * 批量处理多个通话
 */
export async function processBatchAnalysis(
  inputs: ETLInput[],
  options: { createCall?: boolean; clearExisting?: boolean } = {}
): Promise<{ results: ETLResult[]; summary: { total: number; success: number; failed: number } }> {
  const results: ETLResult[] = []
  let successCount = 0
  let failedCount = 0

  for (const input of inputs) {
    const result = await processCallAnalysis(input, options)
    results.push(result)
    if (result.success) {
      successCount++
    } else {
      failedCount++
    }
  }

  return {
    results,
    summary: {
      total: inputs.length,
      success: successCount,
      failed: failedCount
    }
  }
}

// ============================================
// Legacy Support (for backward compatibility)
// ============================================

/**
 * @deprecated Use processCallAnalysis instead
 * Legacy interface for old format
 */
export interface RawAISignal {
  tag: string
  category: string
  dimension: string
  score: number
  reasoning?: string
  context?: string
}

/**
 * @deprecated Use processCallAnalysis instead
 * Legacy function for backward compatibility
 */
export async function processAIAnalysis(result: { callId: string; audioUrl?: string; signals: RawAISignal[] }) {
  console.warn('processAIAnalysis is deprecated. Use processCallAnalysis instead.')

  // Convert old format to new format
  const tags: TagEvent[] = result.signals.map(s => ({
    tag: s.tag,
    category: s.category,
    dimension: s.dimension,
    polarity: 'positive',
    severity: null,
    score: s.score,
    reasoning: s.reasoning || '',
    context_events: s.context ? [{ timestamp_sec: 0, context_text: s.context, confidence: 1 }] : []
  }))

  const input: ETLInput = {
    callId: result.callId,
    audioUrl: result.audioUrl,
    analysisResult: {
      signal_events: [],
      tags
    }
  }

  return processCallAnalysis(input, { clearExisting: true })
}
