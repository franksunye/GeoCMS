
import { NextRequest, NextResponse } from 'next/server'
import { processAIAnalysis, AIAnalysisResult } from '@/lib/etl'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic Validation
    if (!body.callId || !Array.isArray(body.signals)) {
      return NextResponse.json(
        { error: 'Invalid payload. callId and signals array are required.' },
        { status: 400 }
      )
    }

    const result = processAIAnalysis(body as AIAnalysisResult)

    return NextResponse.json({
      message: 'Analysis processed successfully',
      details: result
    })

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
