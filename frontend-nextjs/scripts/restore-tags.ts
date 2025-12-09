import Database from 'better-sqlite3'
import path from 'path'

/**
 * Tags数据恢复工具
 * 
 * 功能：恢复tags表的基础数据到数据库
 * 使用：npx tsx scripts/restore-tags.ts
 * 
 * 此脚本会：
 * 1. 检查tags表是否存在，如果不存在则创建
 * 2. 恢复38个基础tags数据
 * 3. 使用UPSERT操作（存在则更新，不存在则插入）
 * 4. 提供详细的执行日志和验证
 */

const dbPath = path.join(process.cwd(), 'team-calls.db')

// 基础tags数据 - 根据实际数据库表结构
const BASE_TAGS = [
    // Sales - Sales.Process
    { id: '1', code: 'opening_complete', name: '开场白完整', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-1', description: '完整介绍角色与目的', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '2', code: 'needs_identification_basic', name: '基础需求识别', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '基础需求识别', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '3', code: 'needs_identification_deep', name: '深度需求挖掘', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '深度需求探查（原因推测等）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '4', code: 'solution_proposal_basic', name: '基础方案提案', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '极低', scoreRange: '1-5', description: '提供基础方案方向', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '5', code: 'solution_proposal_professional', name: '专业方案提案', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '解释检测技术、拆除可能性', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '6', code: 'schedule_attempt', name: '尝试预约', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '尝试推进预约', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '7', code: 'same_day_visit_attempt', name: '当日上门尝试', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '主动提出当天上门', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '8', code: 'handover_process_explained', name: '流程交接说明', category: 'Sales', dimension: 'Sales.Process', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '明确流程（检测→报价→施工）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    
    // Sales - Sales.Skills
    { id: '9', code: 'skill_handle_objection_basic', name: '基础异议处理', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '常规异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '10', code: 'skill_handle_objection_price', name: '价格异议处理', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '极低', description: '价格异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '11', code: 'skill_handle_objection_time', name: '时间异议处理', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '时间类异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '12', code: 'skill_handle_objection_scope', name: '范围异议处理', category: 'Sales', dimension: 'Sales.Skills', polarity: '极低', severity: '无', scoreRange: '1-5', description: '对检测/拆除的异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '13', code: 'skill_handle_objection_risk', name: '风险异议处理', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '极低风险的异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '14', code: 'skill_handle_objection_trust', name: '信任异议处理', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '信任类异议处理', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '15', code: 'active_selling_proposition', name: '主动销售主张', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '主动介绍服务价值', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '极低', code: 'objection_prevention_proactive', name: '主动异议预防', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '主动预防异议（提前说明）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '17', code: 'expectation_setting', name: '预期管理', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '预期管理（时间/施工范围）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '18', code: '极低', name: '专业能力展示', category: 'Sales', dimension: 'Sales.Skills', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '技术专业性展示', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-极低' },

    // Sales - Sales.Communication
    { id: '19', code: 'listening_good', name: '倾听技巧', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '认真倾听（复述、回应）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '20', code: 'empathy_response', name: '同理心回应', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '共情、安抚客户情绪', active: 1, createdAt: '2025-12-04', updated极低: '2025-12-04' },
    { id: '21', code: 'clarity_of_explanation', name: '解释清晰度', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '解释清晰易懂', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '22', code: 'tone_professional', name: '专业语气', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '专业语气', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '23', code: 'attitude_positive', name: '积极态度', category: 'Sales', dimension: 'Sales.Communication', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '态度积极', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Customer - Customer.Intent
    { id: '24', code: 'customer_high_intent', name: '客户高意向', category: 'Customer', dimension: 'Customer.Intent', polarity: 'positive', severity: '无', scoreRange: '1-5', description: '强烈需求（急、焦虑）', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '25', code: 'customer_solution_request', name: '客户索要极低', category: 'Customer', dimension: 'Customer.Intent', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '索要维修方案', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '26', code: 'customer_pricing_request', name: '客户询价', category: 'Customer', dimension: 'Customer.Intent', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '索要报价', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '27', code: 'customer_schedule_request', name: '客户要求预约', category: 'Customer', dimension: 'Customer.Intent', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '主动提议预约', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Customer - Customer.Attribute
    { id: '28', code: 'customer_role_owner', name: '客户角色-业主', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'neutral', severity: '无', scoreRange: '1-5', description: '房主身份', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '29',极低: 'customer_objection_price', name: '客户异议-价格', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '价格异议', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '30', code: 'customer_objection_time', name: '客户异议-时间', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '时间冲突', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '31', code: 'customer_objection_trust', name: '客户异议-信任', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '不信任', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '32', code: 'customer_objection_scope', name: '客户异议-范围', category: 'Customer', dimension: 'Customer.Attribute', polarity: 'negative', severity: '无', scoreRange: '1-5', description: '质疑必要性', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },

    // Service Issue
    { id: '33', code: 'schedule_delay_customer_reason', name: '进度延误-客户原因', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '因客户导致延迟', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '34', code: 'schedule_delay_agent_reason', name: '进度延误-坐席原因', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '因工程师导致延迟', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '35', code: 'misalignment_price', name: '价格偏差', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '费用沟通不一致', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '36', code: 'misalignment_scope', name: '范围偏差', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '对施工范围理解偏差', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '37', code: 'communication_breakdown', name: '沟通中断', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '沟通中断/冲突', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' },
    { id: '38', code: 'risk_unaddressed', name: '风险未解决', category: 'Service Issue', dimension: 'Service Issue', polarity: 'negative', severity: '1-3', scoreRange: '1-5', description: '风险被忽略未解释', active: 1, createdAt: '2025-12-04', updatedAt: '2025-12-04' }
]

async function restoreTags() {
    console.log('🚀 Starting tags restoration process...')
    console.log(`📁 Database path: ${dbPath}`)

    let db: Database.Database
    
    try {
        // 连接数据库
        db = new Database(dbPath)
        console.log('✅ Database connected successfully')

        // 检查tags表是否存在
        const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='tags'`)
        const tableExists = tableCheck.get()
        
        if (!tableExists) {
            console.log('⚠️ Tags table does not exist. Creating table...')
            
            // 创建tags表
            const createTable = db.prepare(`
                CREATE TABLE tags (
                    id TEXT PRIMARY KEY,
                    code TEXT NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    dimension TEXT NOT NULL,
                    polarity TEXT NOT NULL,
                    severity TEXT,
                    scoreRange TEXT NOT NULL,
                    description TEXT NOT NULL,
                    active INTEGER DEFAULT 1,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `)
            
            createTable.run()
            console.log('✅ Tags table created successfully')
        } else {
            console.log('✅ Tags table already exists')
        }

        // 准备插入语句
        const insertOrUpdateTag = db.prepare(`
            INSERT INTO tags (id, code, name, category, dimension, polarity, severity, scoreRange, description, active, createdAt, updatedAt)
            VALUES (@id, @code, @name, @category, @dimension, @polarity, @severity, @scoreRange, @description, @active, @createdAt, @updatedAt)
            ON CONFLICT(id) DO UPDATE SET
                code = excluded.code,
                name = excluded.name,
                category = excluded.category,
                dimension = excluded.dimension,
                polarity = excluded.polarity,
                severity = excluded.severity,
                scoreRange = excluded.scoreRange,
                description = excluded.description,
                active = excluded.active,
                updatedAt = excluded.updatedAt
        `)

        // 执行数据恢复
        console.log(`📦 Restoring ${BASE_TAGS.length} base tags...`)
        
        const transaction = db.transaction((items: any[]) => {
            for (const item of items) {
                insertOrUpdateTag.run(item)
            }
        })
        
        transaction(BASE_TAGS)
        console.log('✅ Tags data restored successfully')

        // 验证恢复结果
        const countResult = db.prepare('SELECT COUNT(*) as count FROM tags').get()
        console.log(`📊 Total tags in database: ${countResult.count}`)
        
        // 按分类统计
        const categoryStats = db.prepare(`
            SELECT category, COUNT(*) as count 
            FROM tags 
            GROUP BY category 
            ORDER BY count DESC
        `).all()
        
        console.log('📈 Tags by category:')
        categoryStats.forEach((stat: any) => {
            console.log(`   ${stat.category}: ${stat.count} tags`)
        })

        console.log('🎉 Tags restoration completed successfully!')
        
    } catch (error) {
        console.error('❌ Failed to restore tags:', error)
        process.exit(1)
    } finally {
        if (db) {
            db.close()
            console.log('🔌 Database connection closed')
        }
    }
}

// 执行恢复
restoreTags().catch(console.error)