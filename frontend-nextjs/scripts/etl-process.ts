
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

// Disable FKs for ETL
db.pragma('foreign_keys = OFF');

interface SignalEvent {
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

interface TagEvent {
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
}

interface NewSignalsFormat {
  signal_events: SignalEvent[]
  tags: TagEvent[]
}

interface AnalysisLog {
  id: string
  dealId: string
  signals: string // JSON string
  createdAt: string
  agentId: string
  teamId: string
}

function runETL() {
  console.log('Starting ETL Process...')

  // 1. Prepare Tag Map (Code -> ID)
  const allTags = db.prepare('SELECT id, code FROM tags').all() as { id: string, code: string }[]
  const tagMap = new Map<string, string>()
  allTags.forEach(t => tagMap.set(t.code, t.id))
  console.log(`Loaded ${tagMap.size} tags for lookup.`)

  // 2. Prepare Deals Map (ID -> Outcome)
  const allDeals = db.prepare('SELECT id, outcome FROM deals').all() as { id: string, outcome: string }[]
  const dealMap = new Map<string, string>()
  allDeals.forEach(d => dealMap.set(d.id, d.outcome))
  console.log(`Loaded ${dealMap.size} deals for lookup.`)

  // 3. Clear existing data
  console.log('Clearing existing calls, assessments, and signals...')
  db.prepare('DELETE FROM call_assessments').run()
  db.prepare('DELETE FROM call_signals').run()
  db.prepare('DELETE FROM calls').run()

  // 4. Process logs
  const logs = db.prepare(`SELECT * FROM ai_analysis_logs`).all() as AnalysisLog[]
  console.log(`Found ${logs.length} analysis logs to process.`)

  const insertCall = db.prepare(`
    INSERT INTO calls (id, agentId, startedAt, duration, outcome, audioUrl)
    VALUES (@id, @agentId, @startedAt, @duration, @outcome, @audioUrl)
  `)

  const insertAssessment = db.prepare(`
    INSERT INTO call_assessments (id, callId, tagId, score, confidence, reasoning, context_text, timestamp_sec, context_events)
    VALUES (@id, @callId, @tagId, @score, @confidence, @reasoning, @context_text, @timestamp_sec, @context_events)
  `)

  const insertCallSignal = db.prepare(`
    INSERT INTO call_signals (id, callId, signalCode, category, dimension, polarity, timestamp_sec, confidence, context_text, reasoning, createdAt)
    VALUES (@id, @callId, @signalCode, @category, @dimension, @polarity, @timestamp_sec, @confidence, @context_text, @reasoning, @createdAt)
  `)

  let insertedCalls = 0
  let insertedAssessments = 0
  let insertedSignals = 0
  const missingTagCodes = new Set<string>()

  const runTransaction = db.transaction(() => {
    for (const log of logs) {
      const callId = log.dealId
      if (!callId) {
        console.warn(`Log ${log.id} missing dealId, skipping.`)
        continue
      }

      const outcome = dealMap.get(callId) || 'unknown'

      // A. Insert Call
      try {
        insertCall.run({
          id: callId,
          agentId: log.agentId || 'unknown',
          startedAt: log.createdAt,
          duration: 300,
          outcome: outcome,
          audioUrl: ''
        })
        insertedCalls++
      } catch (e) {
        // Ignore duplicate errors
      }

      // B. Parse Signals
      let parsedData: NewSignalsFormat | null = null
      try {
        let rawSignals = log.signals.trim()
        if (rawSignals.startsWith('```json')) {
          rawSignals = rawSignals.replace(/^```json/, '').replace(/```$/, '').trim()
        } else if (rawSignals.startsWith('```')) {
          rawSignals = rawSignals.replace(/^```/, '').replace(/```$/, '').trim()
        }

        parsedData = JSON.parse(rawSignals) as NewSignalsFormat
      } catch (e) {
        console.error(`Failed to parse signals for log ${log.id}`, e)
        continue
      }

      // C. Process Signal Events
      if (parsedData.signal_events && Array.isArray(parsedData.signal_events)) {
        for (const signal of parsedData.signal_events) {
          try {
            insertCallSignal.run({
              id: `sig_${callId}_${insertedSignals}_${Date.now()}`,
              callId: callId,
              signalCode: signal.signal_name,
              category: signal.category || null,
              dimension: signal.dimension || null,
              polarity: signal.polarity || null,
              timestamp_sec: signal.timestamp_sec || null,
              confidence: signal.confidence || 0,
              context_text: signal.context_text || null,
              reasoning: signal.reasoning || null,
              createdAt: log.createdAt
            })
            insertedSignals++
          } catch (e) {
            console.warn(`Failed to insert signal: ${e}`)
          }
        }
      }

      // D. Process Tags (Assessments)
      if (parsedData.tags && Array.isArray(parsedData.tags)) {
        for (const tag of parsedData.tags) {
          const tagId = tagMap.get(tag.tag)

          if (!tagId) {
            missingTagCodes.add(tag.tag)
            continue
          }

          // Convert score 1-5 to 0-100
          const normalizedScore = Math.min(100, Math.max(0, Math.round(tag.score * 20)))

          // Get earliest timestamp from context_events
          let timestamp_sec = null
          if (tag.context_events && tag.context_events.length > 0) {
            timestamp_sec = Math.min(...tag.context_events.map(e => e.timestamp_sec))
          }

          // Get max confidence
          let confidence = 0
          if (tag.context_events && tag.context_events.length > 0) {
            confidence = Math.max(...tag.context_events.map(e => e.confidence))
          }

          // Combine context_text from all events
          let context_text = null
          if (tag.context_events && tag.context_events.length > 0) {
            context_text = tag.context_events.map(e => e.context_text).join(' | ')
          }

          insertAssessment.run({
            id: `assess_${callId}_${tagId}_${Date.now()}`,
            callId: callId,
            tagId: tagId,
            score: normalizedScore,
            confidence: confidence,
            reasoning: tag.reasoning || null,
            context_text: context_text,
            timestamp_sec: timestamp_sec,
            context_events: JSON.stringify(tag.context_events || [])
          })
          insertedAssessments++
        }
      }
    }
  })

  try {
    runTransaction()
    console.log(`ETL Completed Successfully.`)
    console.log(`- Inserted Calls: ${insertedCalls}`)
    console.log(`- Inserted Signals: ${insertedSignals}`)
    console.log(`- Inserted Assessments (Tags): ${insertedAssessments}`)

    if (missingTagCodes.size > 0) {
      console.warn('Warning: The following tag codes were found in signals but not in the database:')
      console.warn(Array.from(missingTagCodes).join(', '))
    }

  } catch (error) {
    console.error('ETL Transaction Failed:', error)
  }
}

runETL()
