
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

// Disable FKs for ETL
db.pragma('foreign_keys = OFF');

interface AISignal {
  tag: string // Code, e.g., "opening_complete"
  category: string
  dimension: string
  polarity: string
  severity: string
  score: number // 1-5
  context: string
  timestamp: string // "00:01:34"
  reasoning: string
}

interface AnalysisLog {
  id: string
  dealId: string
  agentId: string
  signals: string // JSON string
  createdAt: string
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
  console.log('Clearing existing calls and assessments...')
  db.prepare('DELETE FROM call_assessments').run()
  db.prepare('DELETE FROM calls').run()
  
  // 4. Process logs
  const logs = db.prepare('SELECT * FROM ai_analysis_logs').all() as AnalysisLog[]
  console.log(`Found ${logs.length} analysis logs to process.`)

  const insertCall = db.prepare(`
    INSERT INTO calls (id, agentId, startedAt, duration, outcome, audioUrl)
    VALUES (@id, @agentId, @startedAt, @duration, @outcome, @audioUrl)
  `)

  const insertAssessment = db.prepare(`
    INSERT INTO call_assessments (id, callId, tagId, score, reasoning, context_text, timestamp_sec)
    VALUES (@id, @callId, @tagId, @score, @reasoning, @context, @timestamp_sec)
  `)

  let insertedCalls = 0
  let insertedAssessments = 0
  let skippedSignals = 0
  const missingTagCodes = new Set<string>()

  const runTransaction = db.transaction(() => {
    for (const log of logs) {
      // A. Insert Call
      // Using dealId as callId
      const callId = log.dealId;
      if (!callId) {
          console.warn(`Log ${log.id} missing dealId, skipping.`);
          continue;
      }

      const outcome = dealMap.get(callId) || 'unknown';
      
      try {
        insertCall.run({
            id: callId,
            agentId: log.agentId || 'unknown',
            startedAt: log.createdAt,
            duration: 300, // Default mock duration 5 mins
            outcome: outcome,
            audioUrl: '' // Empty for now
        });
        insertedCalls++;
      } catch (e) {
        // Ignore duplicate key errors if multiple logs point to same deal (shouldn't happen 1:1 usually)
        // console.warn(`Call insert failed (maybe duplicate): ${e.message}`);
      }

      // B. Process Signals
      let signals: AISignal[] = []
      try {
        signals = JSON.parse(log.signals)
      } catch (e) {
        console.error(`Failed to parse signals for log ${log.id}`, e)
        continue
      }

      for (const signal of signals) {
        const tagId = tagMap.get(signal.tag)

        if (!tagId) {
          missingTagCodes.add(signal.tag)
          skippedSignals++
          continue
        }

        // Score Normalization: 5-point -> 100-point
        // 1->20, 2->40, 3->60, 4->80, 5->100
        const normalizedScore = Math.min(100, Math.max(0, Math.round(signal.score * 20)))

        // Timestamp Conversion: "HH:MM:SS" -> seconds
        let seconds = 0
        if (signal.timestamp) {
          const parts = signal.timestamp.split(':').map(Number)
          if (parts.length === 3) {
             seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
          } else if (parts.length === 2) {
             seconds = parts[0] * 60 + parts[1]
          }
        }

        insertAssessment.run({
          id: `assess_${callId}_${insertedAssessments}_${Date.now()}`,
          callId: callId,
          tagId: tagId,
          score: normalizedScore,
          reasoning: signal.reasoning || null,
          context: signal.context || null,
          timestamp_sec: seconds
        })

        insertedAssessments++
      }
    }
  })

  try {
    runTransaction()
    console.log(`ETL Completed Successfully.`)
    console.log(`- Inserted Calls: ${insertedCalls}`)
    console.log(`- Inserted Assessments: ${insertedAssessments}`)
    console.log(`- Skipped Signals (Missing Tags): ${skippedSignals}`)
    
    if (missingTagCodes.size > 0) {
      console.warn('Warning: The following tag codes were found in signals but not in the database:')
      console.warn(Array.from(missingTagCodes).join(', '))
    }

  } catch (error) {
    console.error('ETL Transaction Failed:', error)
  }
}

runETL()
