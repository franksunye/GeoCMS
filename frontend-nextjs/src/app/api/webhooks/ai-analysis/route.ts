/**
 * AI Analysis Webhook API
 * 
 * 接收 AI 分析结果并使用 ETL 核心模块处理。
 * 
 * 支持两种格式:
 * 1. 新格式: { callId, signal_events: [], tags: [] }
 * 2. 旧格式 (已废弃): { callId, signals: [] }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  processCallAnalysis,
  parseAnalysisJson,
  ETLInput,
  AIAnalysisResult,
  // Legacy support
  processAIAnalysis,
  RawAISignal
} from '@/lib/etl'

// New format payload
interface NewFormatPayload {
  callId: string
  agentId?: string
  audioUrl?: string
  signal_events: Array<{
    signal_name: string
    category: string
    dimension: string
    polarity: string
    severity: string | null
    context_text: string
    timestamp_sec: number
    confidence: number
    reasoning: string
  }>
  tags: Array<{
    tag: string
    category: string
    dimension: string
    polarity: string
    severity: string | null
    score: number
    reasoning: string
    context_events: Array<{
      timestamp_sec: number
      context_text: string
      confidence: number
    }>
  }>
}

// Legacy format payload (deprecated)
interface LegacyPayload {
  callId: string
  audioUrl?: string
  signals: RawAISignal[]
}

function isNewFormat(body: unknown): body is NewFormatPayload {
  return (
    typeof body === 'object' &&
    body !== null &&
    'callId' in body &&
    ('signal_events' in body || 'tags' in body)
  )
}

function isLegacyFormat(body: unknown): body is LegacyPayload {
  return (
    typeof body === 'object' &&
    body !== null &&
    'callId' in body &&
    'signals' in body &&
    Array.isArray((body as LegacyPayload).signals)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate callId is present
    if (!body.callId) {
      return NextResponse.json(
        { error: 'Invalid payload. callId is required.' },
        { status: 400 }
      )
    }

    // Check if new format
    if (isNewFormat(body)) {
      console.log(`Processing AI analysis for call ${body.callId} (new format)`)

      const analysisResult: AIAnalysisResult = {
        signal_events: body.signal_events || [],
        tags: body.tags || []
      }

      const input: ETLInput = {
        callId: body.callId,
        agentId: body.agentId,
        audioUrl: body.audioUrl,
        analysisResult
      }

      const result = processCallAnalysis(input, {
        createCall: false, // Assume call already exists
        clearExisting: true
      })

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'ETL processing failed',
            details: result.errors
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Analysis processed successfully',
        format: 'new',
        details: {
          callId: result.callId,
          insertedSignals: result.insertedSignals,
          insertedAssessments: result.insertedAssessments,
          missingTagCodes: result.missingTagCodes
        }
      })
    }

    // Check if legacy format
    if (isLegacyFormat(body)) {
      console.warn(`Processing AI analysis for call ${body.callId} (legacy format - deprecated)`)

      const result = processAIAnalysis(body)

      return NextResponse.json({
        message: 'Analysis processed successfully',
        format: 'legacy (deprecated)',
        details: result
      })
    }

    // Invalid format
    return NextResponse.json(
      {
        error: 'Invalid payload format.',
        hint: 'Expected either { callId, signal_events, tags } (new format) or { callId, signals } (legacy format)'
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Health check and info
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/ai-analysis',
    description: 'Webhook endpoint for receiving AI analysis results',
    supportedFormats: [
      {
        name: 'new (recommended)',
        schema: {
          callId: 'string (required)',
          agentId: 'string (optional)',
          audioUrl: 'string (optional)',
          signal_events: 'SignalEvent[] (required)',
          tags: 'TagEvent[] (required)'
        }
      },
      {
        name: 'legacy (deprecated)',
        schema: {
          callId: 'string (required)',
          audioUrl: 'string (optional)',
          signals: 'RawAISignal[] (required)'
        }
      }
    ]
  })
}
