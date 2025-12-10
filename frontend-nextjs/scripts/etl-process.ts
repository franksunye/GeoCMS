
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
  severity: string | null
  score: number // 1-5
  confidence: number // 0-1
  context_text: string
  timestamp: string // "00:01:34"
  reasoning: string
}

interface AnalysisLog {
  id: string
  dealId: string
  agentId: string
  signals: string // JSON string
  createdAt: string
  audioUrl?: string // Joined from transcripts
}

function runETL() {
  console.log('Starting ETL Process...')

  // 1. Prepare Tag Map (Code -> ID)
  const allTags = db.prepare('SELECT id, code FROM tags').all() as { id: string, code: string }[]
  const tagMap = new Map<string, string>()
  allTags.forEach(t => tagMap.set(t.code, t.id))
  console.log(`Loaded ${tagMap.size} tags for lookup.`)

  // 1.1 Prepare Signal Map (Code -> TargetTagCode)
  const allSignals = db.prepare('SELECT code, targetTagCode FROM signals').all() as { code: string, targetTagCode: string }[]
  const signalMap = new Map<string, string>()
  allSignals.forEach(s => signalMap.set(s.code, s.targetTagCode))
  console.log(`Loaded ${signalMap.size} signals for lookup.`)

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
  // Join with transcripts to get audioUrl
  const logs = db.prepare(`
    SELECT l.*, t.audioUrl 
    FROM ai_analysis_logs l
    LEFT JOIN transcripts t ON l.transcriptId = t.id
  `).all() as AnalysisLog[]
  console.log(`Found ${logs.length} analysis logs to process.`)

  const insertCall = db.prepare(`
    INSERT INTO calls (id, agentId, startedAt, duration, outcome, audioUrl)
    VALUES (@id, @agentId, @startedAt, @duration, @outcome, @audioUrl)
  `)

  const insertAssessment = db.prepare(`
    INSERT INTO call_assessments (id, callId, tagId, score, confidence, reasoning, context_text, timestamp_sec)
    VALUES (@id, @callId, @tagId, @score, @confidence, @reasoning, @context_text, @timestamp_sec)
  `)

  const insertCallSignal = db.prepare(`
    INSERT INTO call_signals (id, callId, signalCode, detectedAt, confidence, context_text, metadata)
    VALUES (@id, @callId, @signalCode, @detectedAt, @confidence, @context_text, @metadata)
  `)

  let insertedCalls = 0
  let insertedAssessments = 0
  let insertedSignals = 0
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
      // console.log(`Processing call ${callId}, outcome: ${outcome}`); 
      
      try {
        insertCall.run({
            id: callId,
            agentId: log.agentId || 'unknown',
            startedAt: log.createdAt,
            duration: 300, // Default mock duration 5 mins
            outcome: outcome,
            audioUrl: log.audioUrl || '' 
        });
        insertedCalls++;
      } catch (e) {
        // Ignore duplicate key errors if multiple logs point to same deal (shouldn't happen 1:1 usually)
        // console.warn(`Call insert failed (maybe duplicate): ${e.message}`);
      }

      // B. Process Signals
      let signals: AISignal[] = []
      try {
        let rawSignals = log.signals.trim()
        // Remove markdown code blocks if present
        if (rawSignals.startsWith('```json')) {
            rawSignals = rawSignals.replace(/^```json/, '').replace(/```$/, '').trim()
        } else if (rawSignals.startsWith('```')) {
            rawSignals = rawSignals.replace(/^```/, '').replace(/```$/, '').trim()
        }
        
        const parsed = JSON.parse(rawSignals)
        // Handle new structure { signals: [...] }
        if (parsed.signals && Array.isArray(parsed.signals)) {
            signals = parsed.signals
        } else if (Array.isArray(parsed)) {
            // Fallback just in case
            signals = parsed
        }
      } catch (e) {
        console.error(`Failed to parse signals for log ${log.id}`, e)
        continue
      }

      // Aggregation Map: TagID -> Assessment Data
      const tagAssessments = new Map<string, {
        score: number,
        confidence: number,
        reasoning: string[],
        context_text: string[],
        timestamp_sec: number
      }>();

      for (const signal of signals) {
        // 1. Insert Raw Signal
        const signalCode = signal.tag;
        
        // Try to insert into call_signals (even if config is missing, we record the raw event if possible)
        // We need to know if it's a valid signal code? Not necessarily for raw storage, but FK constraint might fail.
        // If FK constraint exists on call_signals.signalCode -> signals.code, we must only insert valid signals.
        // Since we enabled foreign_keys = OFF at the top, we can insert anything?
        // Wait, line 9: db.pragma('foreign_keys = OFF');
        // So we can insert anything.
        
        try {
            insertCallSignal.run({
                id: `sig_${callId}_${insertedSignals}_${Date.now()}`,
                callId: callId,
                signalCode: signalCode,
                detectedAt: signal.timestamp || '00:00:00',
                confidence: signal.confidence || 0,
                context_text: signal.context_text || '',
                metadata: JSON.stringify({ original_score: signal.score, reasoning: signal.reasoning })
            });
            insertedSignals++;
        } catch (e) {
            // console.warn(`Failed to insert signal: ${e.message}`);
        }

        // 2. Resolve Tag
        let targetTagCode = signalMap.get(signalCode);
        let isDirectTag = false;

        if (!targetTagCode) {
            // Fallback: Check if it's already a tag code
            if (tagMap.has(tagMap.get(signalCode) ? signalCode : '')) { // Check if code maps to an ID
                 // Wait, tagMap keys are codes.
                 if (tagMap.has(signalCode)) {
                     targetTagCode = signalCode;
                     isDirectTag = true;
                 }
            }
        }

        if (!targetTagCode) {
          missingTagCodes.add(signalCode)
          skippedSignals++
          continue
        }

        const tagId = tagMap.get(targetTagCode);
        if (!tagId) continue;

        // 3. Aggregate Data
        // Score Normalization: 5-point -> 100-point
        const normalizedScore = Math.min(100, Math.max(0, Math.round(signal.score * 20)));
        
        // Timestamp Conversion
        let seconds = 0
        if (signal.timestamp) {
          const parts = signal.timestamp.split(':').map(Number)
          if (parts.length === 3) {
             seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
          } else if (parts.length === 2) {
             seconds = parts[0] * 60 + parts[1]
          }
        }

        if (!tagAssessments.has(tagId)) {
            tagAssessments.set(tagId, {
                score: normalizedScore,
                confidence: signal.confidence || 0,
                reasoning: signal.reasoning ? [signal.reasoning] : [],
                context_text: signal.context_text ? [signal.context_text] : [],
                timestamp_sec: seconds
            });
        } else {
            const current = tagAssessments.get(tagId)!;
            // Max Score Aggregation
            if (normalizedScore > current.score) {
                current.score = normalizedScore;
            }
            // Max Confidence
            if ((signal.confidence || 0) > current.confidence) {
                current.confidence = signal.confidence || 0;
            }
            // Append info
            if (signal.reasoning) current.reasoning.push(signal.reasoning);
            if (signal.context_text) current.context_text.push(signal.context_text);
            // Keep earliest timestamp? or latest? Let's keep earliest.
            if (seconds < current.timestamp_sec) {
                current.timestamp_sec = seconds;
            }
        }
      }

      // 4. Insert Aggregated Assessments
      for (const [tagId, data] of tagAssessments) {
          insertAssessment.run({
            id: `assess_${callId}_${tagId}_${Date.now()}`,
            callId: callId,
            tagId: tagId,
            score: data.score,
            confidence: data.confidence,
            reasoning: data.reasoning.join(' | '),
            context_text: data.context_text.join(' | '),
            timestamp_sec: data.timestamp_sec
          })
          insertedAssessments++
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
