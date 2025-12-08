
import db from './db'

export interface RawAISignal {
  tag: string // This corresponds to the 'code' in our tags table
  category: string
  dimension: string
  score: number // 1-5 scale
  reasoning?: string
  context?: string
}

export interface AIAnalysisResult {
  callId: string
  audioUrl?: string
  signals: RawAISignal[]
}

export function processAIAnalysis(result: AIAnalysisResult) {
  const { callId, audioUrl, signals } = result

  console.log(`Starting ETL for Call ID: ${callId}`)

  // 1. Update Call Audio URL if provided
  if (audioUrl) {
    const updateCall = db.prepare('UPDATE calls SET audioUrl = ? WHERE id = ?')
    const info = updateCall.run(audioUrl, callId)
    if (info.changes === 0) {
      console.warn(`Warning: Call ID ${callId} not found. Audio URL not updated.`)
      // In a real scenario, we might want to create the call record here if it doesn't exist,
      // but usually the call record exists from the CRM sync before analysis.
    } else {
      console.log(`Updated Audio URL for Call ${callId}`)
    }
  }

  // 2. Prepare for Signal Processing
  // Cache tags for lookup: code -> id
  const allTags = db.prepare('SELECT id, code FROM tags').all() as { id: string, code: string }[]
  const tagMap = new Map<string, string>()
  allTags.forEach(t => tagMap.set(t.code, t.id))

  // Prepare statements
  // We will delete existing assessments for this call to ensure a clean slate for the new analysis
  const deleteAssessments = db.prepare('DELETE FROM call_assessments WHERE callId = ?')
  const insertAssessment = db.prepare(`
    INSERT INTO call_assessments (id, callId, tagId, score, reasoning, context_text)
    VALUES (@id, @callId, @tagId, @score, @reasoning, @context)
  `)

  // 3. Execute Transaction
  const runTransaction = db.transaction(() => {
    // Clear old assessments
    deleteAssessments.run(callId)

    let insertedCount = 0
    const missingTags: string[] = []

    for (const signal of signals) {
      const tagId = tagMap.get(signal.tag)

      if (!tagId) {
        missingTags.push(signal.tag)
        continue
      }

      // Convert Score: 5-point scale -> 100-point scale
      // Assuming 1=20, 2=40, 3=60, 4=80, 5=100
      const normalizedScore = Math.min(100, Math.max(0, signal.score * 20))

      insertAssessment.run({
        id: `${callId}_assess_${Date.now()}_${insertedCount}`, // Simple unique ID generation
        callId: callId,
        tagId: tagId,
        score: normalizedScore,
        reasoning: signal.reasoning || null,
        context: signal.context || null
      })
      insertedCount++
    }

    return { insertedCount, missingTags }
  })

  try {
    const result = runTransaction()
    console.log(`ETL Complete. Inserted ${result.insertedCount} assessments.`)
    if (result.missingTags.length > 0) {
      console.warn(`Warning: The following tags were not found in the database: ${result.missingTags.join(', ')}`)
    }
    return { success: true, ...result }
  } catch (error) {
    console.error('ETL Failed:', error)
    throw error
  }
}
