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
      code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      is_mandatory BOOLEAN DEFAULT 0,
      dimension TEXT NOT NULL,
      polarity TEXT NOT NULL,
      severity TEXT,
      scoreRange TEXT NOT NULL,
      description TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      dimension TEXT NOT NULL,
      targetTagCode TEXT NOT NULL,
      aggregationMethod TEXT NOT NULL,
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
    `CREATE TABLE IF NOT EXISTS call_signals (
      id TEXT PRIMARY KEY,
      callId TEXT NOT NULL,
      signalCode TEXT NOT NULL,
      category TEXT,
      dimension TEXT,
      polarity TEXT,
      timestamp_sec REAL,
      confidence REAL DEFAULT 0,
      context_text TEXT,
      reasoning TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(callId) REFERENCES calls(id)
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
      dealId TEXT NOT NULL,
      signals TEXT NOT NULL, -- JSON array of signals
      createdAt TEXT NOT NULL,
      FOREIGN KEY(dealId) REFERENCES calls(id)
    )`,
    `CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT,
      content TEXT NOT NULL,
      description TEXT,
      prompt_type TEXT DEFAULT 'quality_check',
      variables TEXT,
      output_schema TEXT,
      is_default BOOLEAN DEFAULT 0,
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS prompt_execution_logs (
      id TEXT PRIMARY KEY,
      promptId TEXT NOT NULL,
      callId TEXT NOT NULL,
      input_variables TEXT,
      raw_output TEXT,
      parsed_output TEXT,
      execution_time_ms INTEGER,
      status TEXT NOT NULL,
      error_message TEXT,
      is_dry_run INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(promptId) REFERENCES prompts(id),
      FOREIGN KEY(callId) REFERENCES calls(id)
    )`
  ]

  tables.forEach(sql => db.exec(sql))

  // Migration: Add new columns if they don't exist
  try {
    // Migrate prompts table - add new columns if they don't exist
    const promptColumns = db.prepare('PRAGMA table_info(prompts)').all() as any[]
    const promptColumnNames = promptColumns.map(c => c.name)

    if (promptColumns.length > 0) {
      if (!promptColumnNames.includes('prompt_type')) {
        console.log('Migrating: Adding prompt_type column to prompts')
        db.exec("ALTER TABLE prompts ADD COLUMN prompt_type TEXT DEFAULT 'quality_check'")
      }
      if (!promptColumnNames.includes('variables')) {
        console.log('Migrating: Adding variables column to prompts')
        db.exec('ALTER TABLE prompts ADD COLUMN variables TEXT')
      }
      if (!promptColumnNames.includes('output_schema')) {
        console.log('Migrating: Adding output_schema column to prompts')
        db.exec('ALTER TABLE prompts ADD COLUMN output_schema TEXT')
      }
    }

    // Create indexes for prompt_execution_logs
    db.exec('CREATE INDEX IF NOT EXISTS idx_prompt_logs_promptId ON prompt_execution_logs(promptId)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_prompt_logs_callId ON prompt_execution_logs(callId)')

    // Migrate ai_analysis_logs
    const logColumns = db.prepare('PRAGMA table_info(ai_analysis_logs)').all() as any[]
    const logColumnNames = logColumns.map(c => c.name)

    if (!logColumnNames.includes('dealId')) {
      console.log('Migrating: Recreating ai_analysis_logs table to match new schema')
      db.exec('DROP TABLE IF EXISTS ai_analysis_logs')
      db.exec(`CREATE TABLE IF NOT EXISTS ai_analysis_logs(
      id TEXT PRIMARY KEY,
      dealId TEXT NOT NULL,
      signals TEXT NOT NULL, --JSON array of signals
        createdAt TEXT NOT NULL,
      FOREIGN KEY(dealId) REFERENCES calls(id)
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
    if (!caColumnNames.includes('context_events')) {
      console.log('Migrating: Adding context_events column to call_assessments')
      db.exec('ALTER TABLE call_assessments ADD COLUMN context_events TEXT')
    }

    // Migrate call_signals - check if table has new structure
    const csColumns = db.prepare('PRAGMA table_info(call_signals)').all() as any[]
    const csColumnNames = csColumns.map(c => c.name)

    // If table exists but lacks new columns, recreate it
    if (csColumns.length > 0 && (!csColumnNames.includes('category') || !csColumnNames.includes('reasoning') || !csColumnNames.includes('timestamp_sec'))) {
      console.log('Migrating: Recreating call_signals table with new schema')
      db.exec('DROP TABLE IF EXISTS call_signals')
      db.exec(`CREATE TABLE IF NOT EXISTS call_signals(
      id TEXT PRIMARY KEY,
      callId TEXT NOT NULL,
      signalCode TEXT NOT NULL,
      category TEXT,
      dimension TEXT,
      polarity TEXT,
      timestamp_sec REAL,
      confidence REAL DEFAULT 0,
      context_text TEXT,
      reasoning TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(callId) REFERENCES calls(id)
    )`)
    }

    // Create indexes for call_signals if not exist
    db.exec('CREATE INDEX IF NOT EXISTS idx_call_signals_callId ON call_signals(callId)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_call_signals_signalCode ON call_signals(signalCode)')

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

  // Check/Seed Prompts
  const promptCount = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='prompts'").get() as { count: number }
  if (promptCount.count > 0) {
    const pCount = db.prepare('SELECT count(*) as count FROM prompts').get() as { count: number }
    if (pCount.count === 0) {
      console.log('Seeding default prompts...')

      const defaultPromptContent = `你是一位专业的销售通话质检分析师。请仔细分析以下通话记录，识别销售行为信号并进行质量评估。

## 通话记录
{{transcript}}

## 信号检测任务
请从通话中识别以下类型的信号（Signal）：

### A. 销售方信号 (Sales)
**流程维度 (Process)**:
- opening_complete: 开场完成（自我介绍+说明目的）
- needs_identification_basic: 基础需求识别
- needs_identification_deep: 深度需求识别
- solution_proposal_basic: 基础方案提议
- solution_proposal_professional: 专业方案提议
- schedule_attempt: 尝试安排时间
- same_day_visit_attempt: 尝试当天上门
- handover_process_explained: 解释交接流程

**技能维度 (Skills)**:
- skill_handle_objection_basic: 处理基础异议
- skill_handle_objection_price: 处理价格异议
- skill_handle_objection_time: 处理时间异议
- skill_handle_objection_scope: 处理范围异议
- skill_handle_objection_risk: 处理风险异议
- skill_handle_objection_trust: 处理信任异议
- active_selling_proposition: 主动销售主张
- objection_prevention_proactive: 主动异议预防
- expectation_setting: 期望值设定
- expertise_display: 专业知识展示

**沟通维度 (Communication)**:
- listening_good: 良好倾听
- empathy_response: 共情回应
- clarity_of_explanation: 清晰解释
- tone_professional: 专业语气
- attitude_positive: 积极态度

### B. 客户方信号 (Customer)
**意向维度 (Intent)**:
- customer_high_intent: 高意向
- customer_solution_request: 解决方案请求
- customer_pricing_request: 价格询问
- customer_schedule_request: 时间安排请求

**约束维度 (Constraint)**:
- customer_role_owner: 客户是业主/决策者
- customer_objection_price: 价格异议
- customer_objection_time: 时间异议
- customer_objection_trust: 信任异议
- customer_objection_scope: 范围异议

### C. 服务问题 (Service Issue)
- schedule_delay_customer_reason: 客户原因导致的排期延迟
- schedule_delay_agent_reason: 客服原因导致的排期延迟
- misalignment_price: 价格不一致
- misalignment_scope: 范围不一致
- communication_breakdown: 沟通中断
- risk_unaddressed: 风险未解决

## 输出要求
请以 JSON 格式输出，包含以下结构：

\`\`\`json
{
  "signals": [
    {
      "code": "信号代码",
      "name": "信号名称",
      "category": "Sales|Customer|Service Issue",
      "dimension": "Process|Skills|Communication|Intent|Constraint|Service Issue",
      "polarity": "positive|negative|neutral",
      "score": 1-5,
      "confidence": 0.0-1.0,
      "timestamp_sec": 出现时间（秒）,
      "context_text": "相关原文引用",
      "reasoning": "评分理由"
    }
  ],
  "summary": {
    "total_signals": 信号总数,
    "process_score": 1-100,
    "skills_score": 1-100,
    "communication_score": 1-100,
    "overall_assessment": "整体评价文字"
  }
}
\`\`\`

## 评分标准
- 1分: 差 - 执行质量很差或表现微弱
- 2分: 较差 - 执行质量较差或表现不足
- 3分: 合格 - 执行质量合格或表现中等
- 4分: 良好 - 执行质量良好或表现较强
- 5分: 优秀 - 执行质量优秀或表现非常强

请严格按照 JSON 格式输出，不要包含其他解释文字。`

      const defaultVariables = JSON.stringify([
        { name: 'transcript', description: '通话文本记录', required: true }
      ])

      const defaultOutputSchema = JSON.stringify({
        type: 'object',
        properties: {
          signals: { type: 'array', description: '检测到的信号列表' },
          summary: { type: 'object', description: '分析摘要' }
        }
      })

      db.prepare(`
            INSERT INTO prompts(id, name, version, content, description, prompt_type, variables, output_schema, is_default, active, createdAt, updatedAt)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        'default_prompt_v1',
        '标准销售质检分析',
        '1.0',
        defaultPromptContent,
        '标准销售通话质量检测提示词，识别销售行为信号并进行质量评估。支持流程、技能、沟通三个维度的综合分析。',
        'quality_check',
        defaultVariables,
        defaultOutputSchema,
        1,
        1,
        new Date().toISOString(),
        new Date().toISOString()
      )
    }
  }

  if (tagCount.count === 0) {
    console.log('Seeding database with mock data...')
    seedDatabase()
  }
}

function seedDatabase() {
  const tags = [
    // Sales - Sales.Process
    { id: '1', name: '开场白完整', code: 'opening_complete', category: 'Sales', dimension: 'Process', is_mandatory: 1, type: 'positive', severity: '无', scoreRange: '1-1', description: '完整介绍角色与目的', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '2', name: '基础需求识别', code: 'needs_identification_basic', category: 'Sales', dimension: 'Process', is_mandatory: 0, type: 'positive', severity: '无', scoreRange: '1-5', description: '基础需求识别', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '3', name: '深度需求挖掘', code: 'needs_identification_deep', category: 'Sales', dimension: 'Process', is_mandatory: 0, type: 'positive', severity: '无', scoreRange: '1-5', description: '深度需求探查（原因推测等）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '4', name: '基础方案提案', code: 'solution_proposal_basic', category: 'Sales', dimension: 'Process', is_mandatory: 0, type: 'positive', severity: '无', scoreRange: '1-5', description: '提供基础方案方向', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '5', name: '专业方案提案', code: 'solution_proposal_professional', category: 'Sales', dimension: 'Process', is_mandatory: 0, type: 'positive', severity: '无', scoreRange: '1-5', description: '解释检测技术、拆除可能性', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '6', name: '尝试预约', code: 'schedule_attempt', category: 'Sales', dimension: 'Process', is_mandatory: 1, type: 'positive', severity: '无', scoreRange: '1-5', description: '尝试推进预约', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '7', name: '当日上门尝试', code: 'same_day_visit_attempt', category: 'Sales', dimension: 'Process', is_mandatory: 0, type: 'positive', severity: '无', scoreRange: '1-5', description: '主动提出当天上门', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '8', name: '流程交接说明', code: 'handover_process_explained', category: 'Sales', dimension: 'Process', is_mandatory: 1, type: 'positive', severity: '无', scoreRange: '1-5', description: '明确流程（检测→报价→施工）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Sales - Sales.Skills
    { id: '9', name: '基础异议处理', code: 'skill_handle_objection_basic', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '常规异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '10', name: '价格异议处理', code: 'skill_handle_objection_price', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '价格异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '11', name: '时间异议处理', code: 'skill_handle_objection_time', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '时间类异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '12', name: '范围异议处理', code: 'skill_handle_objection_scope', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '对检测/拆除的异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '13', name: '风险异议处理', code: 'skill_handle_objection_risk', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '对风险的异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '14', name: '信任异议处理', code: 'skill_handle_objection_trust', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '信任类异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '15', name: '主动销售主张', code: 'active_selling_proposition', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '主动介绍服务价值', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '16', name: '主动异议预防', code: 'objection_prevention_proactive', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '主动预防异议（提前说明）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '17', name: '预期管理', code: 'expectation_setting', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '预期管理（时间/施工范围）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '18', name: '专业能力展示', code: 'expertise_display', category: 'Sales', dimension: 'Skills', type: 'positive', severity: '无', scoreRange: '1-5', description: '技术专业性展示', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Sales - Sales.Communication
    { id: '19', name: '倾听技巧', code: 'listening_good', category: 'Sales', dimension: 'Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '认真倾听（复述、回应）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '20', name: '同理心回应', code: 'empathy_response', category: 'Sales', dimension: 'Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '共情、安抚客户情绪', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '21', name: '解释清晰度', code: 'clarity_of_explanation', category: 'Sales', dimension: 'Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '解释清晰易懂', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '22', name: '专业语气', code: 'tone_professional', category: 'Sales', dimension: 'Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '专业语气', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '23', name: '积极态度', code: 'attitude_positive', category: 'Sales', dimension: 'Communication', type: 'positive', severity: '无', scoreRange: '1-5', description: '态度积极', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

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
    INSERT INTO tags(id, name, code, category, is_mandatory, dimension, type, severity, scoreRange, description, active, createdAt, updatedAt)
    VALUES(@id, @name, @code, @category, @is_mandatory, @dimension, @type, @severity, @scoreRange, @description, @active, @createdAt, @updatedAt)
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
  const insertRule = db.prepare(`INSERT INTO scoring_rules(id, name, appliesTo, description, active, ruleType, tagCode, targetDimension, scoreAdjustment, weight, createdAt, updatedAt) VALUES(@id, @name, @appliesTo, @description, @active, @ruleType, @tagCode, @targetDimension, @scoreAdjustment, @weight, @createdAt, @updatedAt)`)
  db.transaction((data) => { for (const item of data) insertRule.run(item) })(rules)

  // Insert Score Config
  db.prepare(`INSERT INTO score_config(id, aggregationMethod, processWeight, skillsWeight, communicationWeight, description, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`).run('1', 'weighted-average', 30, 50, 20, 'Default', '2025-12-01', '2025-12-03')


  // --- NEW RELATIONAL SEED DATA ---

  // 1. Agents
  const agents = [
    { id: '1', name: 'Mike Jones', avatarId: 'knowledge', teamId: '9055771909563658940', createdAt: '2025-01-01' },
    { id: '2', name: 'Sarah Johnson', avatarId: 'planner', teamId: '9055771909563658940', createdAt: '2025-01-01' },
    { id: '3', name: 'Derrick Deacon', avatarId: 'writer', teamId: '9055771909563658940', createdAt: '2025-01-01' },
    { id: '4', name: 'Sheryl Grow', avatarId: 'verifier', teamId: '9055771909563658940', createdAt: '2025-01-01' },
    { id: '5', name: 'Sam Waltman', avatarId: 'call_analysis', teamId: '9055771909563658940', createdAt: '2025-01-01' },
  ]

  const insertAgent = db.prepare(`INSERT INTO agents(id, name, avatarId, createdAt) VALUES(@id, @name, @avatarId, @createdAt)`)
  const insertAgentTx = db.transaction((data) => { for (const item of data) insertAgent.run(item) })
  insertAgentTx(agents)

  // 2. Calls & Assessments
  // We will generate ~20 calls per agent
  const insertCall = db.prepare(`INSERT INTO calls(id, agentId, startedAt, duration, outcome, audioUrl) VALUES(@id, @agentId, @startedAt, @duration, @outcome, @audioUrl)`)
  const insertAssessment = db.prepare(`INSERT INTO call_assessments(id, callId, tagId, score, reasoning) VALUES(@id, @callId, @tagId, @score, @reasoning)`)

  const generateCalls = db.transaction(() => {
    let callIdCounter = 1
    let assessmentIdCounter = 1

    agents.forEach((agent, index) => {
      // Agent performance profile (0-1 multiplier)
      // Mike (0) is great (0.9), Sarah (1) is good (0.8), others lower
      const performance = 0.9 - (index * 0.15)

      for (let i = 0; i < 50; i++) {
        const callId = `call_${callIdCounter++} `
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
