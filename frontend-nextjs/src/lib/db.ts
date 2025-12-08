import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'team-calls.db')
const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// Initialize database
initDatabase()

export default db

// Initialize database with tables and seed data if empty
export function initDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      category TEXT NOT NULL,
      dimension TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT,
      scoreRange TEXT NOT NULL,
      description TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS scoring_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      appliesTo TEXT NOT NULL,
      description TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      ruleType TEXT NOT NULL,
      tagCode TEXT NOT NULL,
      targetDimension TEXT NOT NULL,
      scoreAdjustment REAL NOT NULL,
      weight REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS score_config (
      id TEXT PRIMARY KEY,
      aggregationMethod TEXT NOT NULL,
      processWeight INTEGER NOT NULL,
      skillsWeight INTEGER NOT NULL,
      communicationWeight INTEGER NOT NULL,
      customFormula TEXT,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user TEXT NOT NULL,
      action TEXT NOT NULL,
      objectType TEXT NOT NULL,
      objectName TEXT NOT NULL,
      changes TEXT NOT NULL,
      details TEXT NOT NULL
    )`,
    // New Relational Model
    `CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatarId TEXT NOT NULL,
      teamId TEXT,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      duration INTEGER NOT NULL,
      outcome TEXT NOT NULL, -- 'won' | 'lost'
      audioUrl TEXT,
      FOREIGN KEY(agentId) REFERENCES agents(id)
    )`,
    `CREATE TABLE IF NOT EXISTS call_assessments (
      id TEXT PRIMARY KEY,
      callId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      score INTEGER NOT NULL, -- 0-100
      confidence REAL DEFAULT 0,
      context_text TEXT,
      timestamp_sec INTEGER,
      reasoning TEXT,
      FOREIGN KEY(callId) REFERENCES calls(id),
      FOREIGN KEY(tagId) REFERENCES tags(id)
    )`,
    // Raw Source Tables (for ETL)
    `CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      outcome TEXT NOT NULL, -- 'won' | 'lost'
      createdAt TEXT NOT NULL,
      FOREIGN KEY(agentId) REFERENCES agents(id)
    )`,
    `CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      dealId TEXT NOT NULL,
      agentId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(dealId) REFERENCES deals(id),
      FOREIGN KEY(agentId) REFERENCES agents(id)
    )`,
    `CREATE TABLE IF NOT EXISTS ai_analysis_logs (
      id TEXT PRIMARY KEY,
      callId TEXT NOT NULL,
      signals TEXT NOT NULL, -- JSON array of signals
      createdAt TEXT NOT NULL,
      FOREIGN KEY(callId) REFERENCES calls(id)
    )`
  ]

  tables.forEach(sql => db.exec(sql))

  // Migration: Add new columns if they don't exist
  try {
    // Migrate ai_analysis_logs
    const logColumns = db.prepare('PRAGMA table_info(ai_analysis_logs)').all() as any[]
    const logColumnNames = logColumns.map(c => c.name)

    if (!logColumnNames.includes('callId')) {
       // If table exists but needs migration, we might need to recreate or alter.
       // Since this is a dev env and we are re-simulating, let's just drop and recreate if it lacks callId
       // Or simpler: just add it if possible, but SQLite foreign keys on ALTER are tricky.
       // For now, let's assume we can just add the column or if the table is empty/unused we can drop it.
       // Given the user wants to "re-simulate", dropping it is probably fine.
       console.log('Migrating: Recreating ai_analysis_logs table to match new schema')
       db.exec('DROP TABLE IF EXISTS ai_analysis_logs')
       db.exec(`CREATE TABLE IF NOT EXISTS ai_analysis_logs (
        id TEXT PRIMARY KEY,
        callId TEXT NOT NULL,
        signals TEXT NOT NULL, -- JSON array of signals
        createdAt TEXT NOT NULL,
        FOREIGN KEY(callId) REFERENCES calls(id)
      )`)
    }
    // Migrate call_assessments
    const caColumns = db.prepare('PRAGMA table_info(call_assessments)').all() as any[]
    const caColumnNames = caColumns.map(c => c.name)
    
    if (!caColumnNames.includes('confidence')) {
      console.log('Migrating: Adding confidence column to call_assessments')
      db.exec('ALTER TABLE call_assessments ADD COLUMN confidence REAL DEFAULT 0')
    }
    if (!caColumnNames.includes('context_text')) {
      console.log('Migrating: Adding context_text column to call_assessments')
      db.exec('ALTER TABLE call_assessments ADD COLUMN context_text TEXT')
    }
    if (!caColumnNames.includes('timestamp_sec')) {
      console.log('Migrating: Adding timestamp_sec column to call_assessments')
      db.exec('ALTER TABLE call_assessments ADD COLUMN timestamp_sec INTEGER')
    }
    if (!caColumnNames.includes('reasoning')) {
      console.log('Migrating: Adding reasoning column to call_assessments')
      db.exec('ALTER TABLE call_assessments ADD COLUMN reasoning TEXT')
    }

    // Migrate agents
    const agentColumns = db.prepare('PRAGMA table_info(agents)').all() as any[]
    const agentColumnNames = agentColumns.map(c => c.name)

    if (!agentColumnNames.includes('teamId')) {
      console.log('Migrating: Adding teamId column to agents')
      db.exec('ALTER TABLE agents ADD COLUMN teamId TEXT')
    }

    // Migrate calls
    const callColumns = db.prepare('PRAGMA table_info(calls)').all() as any[]
    const callColumnNames = callColumns.map(c => c.name)

    if (!callColumnNames.includes('audioUrl')) {
      console.log('Migrating: Adding audioUrl column to calls')
      db.exec('ALTER TABLE calls ADD COLUMN audioUrl TEXT')
    }
  } catch (error) {
    console.error('Migration error:', error)
  }

  // Check if data exists, if not seed it
  const tagCount = db.prepare('SELECT count(*) as count FROM tags').get() as { count: number }
  
  if (tagCount.count === 0) {
    console.log('Seeding database with mock data...')
    seedDatabase()
  }
}

function seedDatabase() {
  const tags = [
    // Sales - Sales.Process
    { id: '1', name: '开场白完整', code: 'opening_complete', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-1', description: '完整介绍角色与目的', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '2', name: '基础需求识别', code: 'needs_identification_basic', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '基础需求识别', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '3', name: '深度需求挖掘', code: 'needs_identification_deep', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '深度需求探查（原因推测等）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '4', name: '基础方案提案', code: 'solution_proposal_basic', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '提供基础方案方向', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '5', name: '专业方案提案', code: 'solution_proposal_professional', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '解释检测技术、拆除可能性', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '6', name: '尝试预约', code: 'schedule_attempt', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '尝试推进预约', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '7', name: '当日上门尝试', code: 'same_day_visit_attempt', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '主动提出当天上门', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '8', name: '流程交接说明', code: 'handover_process_explained', category: 'Sales', dimension: 'Sales.Process', type: 'positive', severity: '无', scoreRange: '1-5', description: '明确流程（检测→报价→施工）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    
    // Sales - Sales.Skills
    { id: '9', name: '基础异议处理', code: 'skill_handle_objection_basic', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '常规异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '10', name: '价格异议处理', code: 'skill_handle_objection_price', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '价格异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '11', name: '时间异议处理', code: 'skill_handle_objection_time', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '时间类异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '12', name: '范围异议处理', code: 'skill_handle_objection_scope', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '对检测/拆除的异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '13', name: '风险异议处理', code: 'skill_handle_objection_risk', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '对风险的异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '14', name: '信任异议处理', code: 'skill_handle_objection_trust', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '信任类异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '15', name: '主动销售主张', code: 'active_selling_proposition', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '主动介绍服务价值', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '16', name: '主动异议预防', code: 'objection_prevention_proactive', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '主动预防异议（提前说明）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '17', name: '预期管理', code: 'expectation_setting', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '预期管理（时间/施工范围）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '18', name: '专业能力展示', code: 'expertise_display', category: 'Sales', dimension: 'Sales.Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '技术专业性展示', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Sales - Sales.Communication
    { id: '19', name: '倾听技巧', code: 'listening_good', category: 'Sales', dimension: 'Sales.Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '认真倾听（复述、回应）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '20', name: '同理心回应', code: 'empathy_response', category: 'Sales', dimension: 'Sales.Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '共情、安抚客户情绪', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '21', name: '解释清晰度', code: 'clarity_of_explanation', category: 'Sales', dimension: 'Sales.Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '解释清晰易懂', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '22', name: '专业语气', code: 'tone_professional', category: 'Sales', dimension: 'Sales.Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '专业语气', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '23', name: '积极态度', code: 'attitude_positive', category: 'Sales', dimension: 'Sales.Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '态度积极', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Customer - Customer.Intent
    { id: '24', name: '客户高意向', code: 'customer_high_intent', category: 'Customer', dimension: 'Customer.Intent', type: 'positive', severity: '无', scoreRange: '1-5', description: '强烈需求（急、焦虑）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '25', name: '客户索要方案', code: 'customer_solution_request', category: 'Customer', dimension: 'Customer.Intent', type: 'neutral', severity: '无', scoreRange: '1-5', description: '索要维修方案', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '26', name: '客户询价', code: 'customer_pricing_request', category: 'Customer', dimension: 'Customer.Intent', type: 'neutral', severity: '无', scoreRange: '1-5', description: '索要报价', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '27', name: '客户要求预约', code: 'customer_schedule_request', category: 'Customer', dimension: 'Customer.Intent', type: 'neutral', severity: '无', scoreRange: '1-5', description: '主动提议预约', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Customer - Customer.Attribute
    { id: '28', name: '客户角色-业主', code: 'customer_role_owner', category: 'Customer', dimension: 'Customer.Attribute', type: 'neutral', severity: '无', scoreRange: '1-5', description: '房主身份', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '29', name: '客户异议-价格', code: 'customer_objection_price', category: 'Customer', dimension: 'Customer.Attribute', type: 'negative', severity: '无', scoreRange: '1-5', description: '价格异议', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '30', name: '客户异议-时间', code: 'customer_objection_time', category: 'Customer', dimension: 'Customer.Attribute', type: 'negative', severity: '无', scoreRange: '1-5', description: '时间冲突', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '31', name: '客户异议-信任', code: 'customer_objection_trust', category: 'Customer', dimension: 'Customer.Attribute', type: 'negative', severity: '无', scoreRange: '1-5', description: '不信任', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '32', name: '客户异议-范围', code: 'customer_objection_scope', category: 'Customer', dimension: 'Customer.Attribute', type: 'negative', severity: '无', scoreRange: '1-5', description: '质疑必要性', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Service Issue
    { id: '33', name: '进度延误-客户原因', code: 'schedule_delay_customer_reason', category: 'Service Issue', dimension: 'Service Issue', type: 'negative', severity: '1-3', scoreRange: '1-5', description: '因客户导致延迟', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '34', name: '进度延误-坐席原因', code: 'schedule_delay_agent_reason', category: 'Service Issue', dimension: 'Service Issue', type: 'negative', severity: '1-3', scoreRange: '1-5', description: '因工程师导致延迟', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '35', name: '价格偏差', code: 'misalignment_price', category: 'Service Issue', dimension: 'Service Issue', type: 'negative', severity: '1-3', scoreRange: '1-5', description: '费用沟通不一致', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '36', name: '范围偏差', code: 'misalignment_scope', category: 'Service Issue', dimension: 'Service Issue', type: 'negative', severity: '1-3', scoreRange: '1-5', description: '对施工范围理解偏差', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '37', name: '沟通中断', code: 'communication_breakdown', category: 'Service Issue', dimension: 'Service Issue', type: 'negative', severity: '1-3', scoreRange: '1-5', description: '沟通中断/冲突', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '38', name: '风险未解决', code: 'risk_unaddressed', category: 'Service Issue', dimension: 'Service Issue', type: 'negative', severity: '1-3', scoreRange: '1-5', description: '风险被忽略未解释', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
  ]

  const insertTag = db.prepare(`
    INSERT INTO tags (id, name, code, category, dimension, type, severity, scoreRange, description, active, createdAt, updatedAt)
    VALUES (@id, @name, @code, @category, @dimension, @type, @severity, @scoreRange, @description, @active, @createdAt, @updatedAt)
  `)

  const insertTransaction = db.transaction((data) => {
    for (const item of data) insertTag.run(item)
  })

  insertTransaction(tags)

  // Config data (Rules, ScoreConfig) - Keep this standard
  const rules = [
    { id: '1', name: 'Customer High Intent Signal', appliesTo: 'Calls', description: 'Strong signal', active: 1, ruleType: 'TagBased', tagCode: 'customer_high_intent', targetDimension: 'skills', scoreAdjustment: 35, weight: 1.5, createdAt: '2025-12-01', updatedAt: '2025-12-01' },
    // ... (simplified for brevity, real app would have more)
  ]
  
  // Insert Rules (simplified)
  const insertRule = db.prepare(`INSERT INTO scoring_rules (id, name, appliesTo, description, active, ruleType, tagCode, targetDimension, scoreAdjustment, weight, createdAt, updatedAt) VALUES (@id, @name, @appliesTo, @description, @active, @ruleType, @tagCode, @targetDimension, @scoreAdjustment, @weight, @createdAt, @updatedAt)`)
  db.transaction((data) => { for (const item of data) insertRule.run(item) })(rules)

  // Insert Score Config
  db.prepare(`INSERT INTO score_config (id, aggregationMethod, processWeight, skillsWeight, communicationWeight, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('1', 'weighted-average', 30, 50, 20, 'Default', '2025-12-01', '2025-12-03')


  // --- NEW RELATIONAL SEED DATA ---

  // 1. Agents
  const agents = [
    { id: '1', name: 'Mike Jones', avatarId: 'knowledge', createdAt: '2025-01-01' },
    { id: '2', name: 'Sarah Johnson', avatarId: 'planner', createdAt: '2025-01-01' },
    { id: '3', name: 'Derrick Deacon', avatarId: 'writer', createdAt: '2025-01-01' },
    { id: '4', name: 'Sheryl Grow', avatarId: 'verifier', createdAt: '2025-01-01' },
    { id: '5', name: 'Sam Waltman', avatarId: 'call_analysis', createdAt: '2025-01-01' },
  ]

  const insertAgent = db.prepare(`INSERT INTO agents (id, name, avatarId, createdAt) VALUES (@id, @name, @avatarId, @createdAt)`)
  const insertAgentTx = db.transaction((data) => { for (const item of data) insertAgent.run(item) })
  insertAgentTx(agents)

  // 2. Calls & Assessments
  // We will generate ~20 calls per agent
  const insertCall = db.prepare(`INSERT INTO calls (id, agentId, startedAt, duration, outcome, audioUrl) VALUES (@id, @agentId, @startedAt, @duration, @outcome, @audioUrl)`)
  const insertAssessment = db.prepare(`INSERT INTO call_assessments (id, callId, tagId, score, reasoning) VALUES (@id, @callId, @tagId, @score, @reasoning)`)

  const generateCalls = db.transaction(() => {
    let callIdCounter = 1
    let assessmentIdCounter = 1

    agents.forEach((agent, index) => {
      // Agent performance profile (0-1 multiplier)
      // Mike (0) is great (0.9), Sarah (1) is good (0.8), others lower
      const performance = 0.9 - (index * 0.15) 
      
      for (let i = 0; i < 50; i++) {
        const callId = `call_${callIdCounter++}`
        const isWin = Math.random() < performance // Win rate correlated with performance
        
        insertCall.run({
          id: callId,
          agentId: agent.id,
          startedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 180).toISOString(), // Past 6 months
          duration: 120 + Math.floor(Math.random() * 600), // 2-12 minutes
          outcome: isWin ? 'won' : 'lost',
          audioUrl: `https://example.com/audio/${callId}.mp3`
        })

        // Generate assessments for this call
        // For simplicity, we score EVERY tag, but with variance based on agent performance
        tags.forEach(tag => {
          // Base score based on agent performance + random noise
          let baseScore = performance * 100
          let noise = (Math.random() - 0.5) * 30 // +/- 15 points
          let score = Math.max(0, Math.min(100, Math.floor(baseScore + noise)))
          
          insertAssessment.run({
            id: `assess_${assessmentIdCounter++}`,
            callId: callId,
            tagId: tag.id,
            score: score,
            reasoning: `AI Reasoning for ${tag.name}: Score ${score} based on agent performance.`
          })
        })
      }
    })
  })

  generateCalls()
  console.log('Database seeded with relational data!')
}
