
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'team-calls.db')
console.log('Opening database at:', dbPath)
const db = new Database(dbPath)

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

const insertOrUpdateTag = db.prepare(`
    INSERT INTO tags (id, name, code, category, dimension, type, severity, scoreRange, description, active, createdAt, updatedAt)
    VALUES (@id, @name, @code, @category, @dimension, @type, @severity, @scoreRange, @description, @active, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        code = excluded.code,
        category = excluded.category,
        dimension = excluded.dimension,
        type = excluded.type,
        severity = excluded.severity,
        scoreRange = excluded.scoreRange,
        description = excluded.description,
        active = excluded.active,
        updatedAt = excluded.updatedAt
`)

const runMigration = db.transaction((items) => {
    for (const item of items) {
        insertOrUpdateTag.run(item)
    }
})

try {
    runMigration(tags)
    console.log(`Successfully migrated ${tags.length} tags (Insert/Update).`)
} catch (error) {
    console.error('Failed to migrate tags:', error)
    process.exit(1)
}
