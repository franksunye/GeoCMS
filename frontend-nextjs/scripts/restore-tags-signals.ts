import Database from 'better-sqlite3'
import path from 'path'
import { randomUUID } from 'crypto'
import { SIGNALS, TAGS } from '../src/lib/data/signal-spec-v5'

/**
 * Tags & Signals 数据恢复工具 (v5.0)
 * 
 * 功能：恢复 tags 和 signals 表的基础数据到数据库
 * 使用：npx tsx scripts/restore-tags-signals.ts
 * 
 * 此脚本会：
 * 1. 检查 tags 和 signals 表是否存在，如果不存在则创建
 * 2. 从 signal-spec-v5.ts 导入数据：
 *    - 28个 Tags（通话级标签，用于评估"做得好不好"）
 *    - 35个 Signals（事件级信号，用于记录"发生了什么"）
 * 3. 使用 UPSERT 操作（存在则更新，不存在则插入）
 * 4. 根据 category/dimension 自动推断 polarity
 * 5. 提供详细的执行日志和验证
 * 
 * 数据来源：Signal_Tags_spec.md v5.0
 */

const dbPath = path.join(process.cwd(), 'team-calls.db')

/**
 * 根据 category 和 dimension 推断 polarity（极性）
 * 
 * 规则（来自 Signal_Tags_spec.md）：
 * - Sales类：positive
 * - Customer.Intent：neutral（除 customer_high_intent 为 positive）
 * - Customer.Constraint：negative
 * - Service Issue：negative
 */
function inferPolarity(category: string, dimension: string, code: string): string {
    if (category === 'Service Issue') {
        return 'negative'
    }
    if (category === 'Customer') {
        if (dimension === 'Constraint') {
            return 'negative'
        }
        if (code === 'customer_high_intent') {
            return 'positive'
        }
        return 'neutral'
    }
    if (category === 'Sales') {
        return 'positive'
    }
    return 'neutral'
}

/**
 * 根据 category 推断 severity（严重程度范围）
 * 仅 Service Issue 类标签需要 severity 1-3
 */
function inferSeverity(category: string): string {
    if (category === 'Service Issue') {
        return '1-3'
    }
    return '无'
}

async function restoreTags() {
    console.log('🚀 Starting Tags & Signals restoration process (v5.0)...')
    console.log(`📁 Database path: ${dbPath}`)
    console.log('')

    let db: Database.Database | null = null

    try {
        // 连接数据库
        db = new Database(dbPath)
        console.log('✅ Database connected successfully')
        console.log('')

        // ==================== TAGS 恢复 ====================
        console.log('═══════════════════════════════════════════')
        console.log('📦 STEP 1: Restoring Tags (通话级标签)')
        console.log('═══════════════════════════════════════════')

        // 检查 tags 表是否存在，存在则删除重建以确保结构一致
        const tagsTableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='tags'`)
        const tagsTableExists = tagsTableCheck.get()

        if (tagsTableExists) {
            console.log('⚠️  Tags table exists. Dropping to apply new schema...')
            db.pragma('foreign_keys = OFF')
            db.prepare('DROP TABLE tags').run()
            db.pragma('foreign_keys = ON')
        }

        console.log('📝 Creating tags table with v5 schema...')

        // 创建 tags 表（匹配 db.ts 中的定义）
        db.exec(`
            CREATE TABLE tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
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
        console.log('✅ Tags table created successfully')

        // 准备插入语句
        const insertTag = db.prepare(`
            INSERT INTO tags (id, name, code, category, dimension, polarity, severity, scoreRange, description, active, createdAt, updatedAt)
            VALUES (@id, @name, @code, @category, @dimension, @polarity, @severity, @scoreRange, @description, @active, @createdAt, @updatedAt)
            ON CONFLICT(code) DO UPDATE SET
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

        // 转换 TAGS 数据并插入
        const now = new Date().toISOString().split('T')[0]

        console.log(`📦 Processing ${TAGS.length} tags from v5 spec...`)

        const tagTransaction = db.transaction(() => {
            for (const tag of TAGS) {
                const polarity = inferPolarity(tag.category, tag.dimension, tag.code)
                const severity = inferSeverity(tag.category)

                insertTag.run({
                    id: randomUUID(),
                    name: tag.name,
                    code: tag.code,
                    category: tag.category,
                    dimension: tag.dimension,
                    polarity: polarity,
                    severity: severity,
                    scoreRange: tag.scoreLogic,
                    description: tag.description,
                    active: 1,
                    createdAt: now,
                    updatedAt: now
                })
            }
        })

        tagTransaction()
        console.log('✅ Tags data restored successfully')

        // 验证 Tags 恢复结果
        const tagCountResult = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number }
        console.log(`📊 Total tags in database: ${tagCountResult.count}`)

        // 按分类统计 Tags
        const tagCategoryStats = db.prepare(`
            SELECT category, COUNT(*) as count 
            FROM tags 
            GROUP BY category 
            ORDER BY count DESC
        `).all()

        console.log('📈 Tags by category:')
        tagCategoryStats.forEach((stat: any) => {
            console.log(`   • ${stat.category}: ${stat.count} tags`)
        })
        console.log('')

        // ==================== SIGNALS 恢复 ====================
        console.log('═══════════════════════════════════════════')
        console.log('📡 STEP 2: Restoring Signals (事件级信号)')
        console.log('═══════════════════════════════════════════')

        // 检查 signals 表是否存在，存在则删除重建
        const signalsTableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='signals'`)
        const signalsTableExists = signalsTableCheck.get()

        if (signalsTableExists) {
            console.log('⚠️  Signals table exists. Dropping to apply new schema...')
            db.pragma('foreign_keys = OFF')
            db.prepare('DROP TABLE signals').run()
            db.pragma('foreign_keys = ON')
        }

        console.log('📝 Creating signals table with v5 schema...')

        // 创建 signals 表（匹配 db.ts 中的定义）
        db.exec(`
            CREATE TABLE signals (
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
            )
        `)
        console.log('✅ Signals table created successfully')

        // 准备插入语句
        const insertSignal = db.prepare(`
            INSERT INTO signals (id, code, name, category, dimension, targetTagCode, aggregationMethod, description, active, createdAt, updatedAt)
            VALUES (@id, @code, @name, @category, @dimension, @targetTagCode, @aggregationMethod, @description, @active, @createdAt, @updatedAt)
            ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                category = excluded.category,
                dimension = excluded.dimension,
                targetTagCode = excluded.targetTagCode,
                aggregationMethod = excluded.aggregationMethod,
                description = excluded.description,
                active = excluded.active,
                updatedAt = excluded.updatedAt
        `)

        console.log(`📡 Processing ${SIGNALS.length} signals from v5 spec...`)

        const signalTransaction = db.transaction(() => {
            for (const signal of SIGNALS) {
                insertSignal.run({
                    id: randomUUID(),
                    code: signal.code,
                    name: signal.name,
                    category: signal.category,
                    dimension: signal.dimension,
                    targetTagCode: signal.targetTagCode,
                    aggregationMethod: signal.aggregation,
                    description: signal.scoreLogic,
                    active: 1,
                    createdAt: now,
                    updatedAt: now
                })
            }
        })

        signalTransaction()
        console.log('✅ Signals data restored successfully')

        // 验证 Signals 恢复结果
        const signalCountResult = db.prepare('SELECT COUNT(*) as count FROM signals').get() as { count: number }
        console.log(`📊 Total signals in database: ${signalCountResult.count}`)

        // 按分类统计 Signals
        const signalCategoryStats = db.prepare(`
            SELECT category, COUNT(*) as count 
            FROM signals 
            GROUP BY category 
            ORDER BY count DESC
        `).all()

        console.log('📈 Signals by category:')
        signalCategoryStats.forEach((stat: any) => {
            console.log(`   • ${stat.category}: ${stat.count} signals`)
        })
        console.log('')

        // ==================== 聚合关系验证 ====================
        console.log('═══════════════════════════════════════════')
        console.log('🔗 STEP 3: Validating Signal → Tag Mappings')
        console.log('═══════════════════════════════════════════')

        // 检查所有 signal 的 targetTagCode 是否都有对应的 tag
        const orphanSignals = db.prepare(`
            SELECT s.code as signalCode, s.targetTagCode
            FROM signals s
            LEFT JOIN tags t ON s.targetTagCode = t.code
            WHERE t.code IS NULL
        `).all() as { signalCode: string; targetTagCode: string }[]

        if (orphanSignals.length === 0) {
            console.log('✅ All signal → tag mappings are valid!')
        } else {
            console.log('⚠️  Warning: Some signals reference non-existent tags:')
            orphanSignals.forEach(orphan => {
                console.log(`   • Signal "${orphan.signalCode}" → Tag "${orphan.targetTagCode}" (NOT FOUND)`)
            })
        }

        // 统计聚合关系
        const aggregationStats = db.prepare(`
            SELECT targetTagCode, COUNT(*) as signalCount
            FROM signals
            GROUP BY targetTagCode
            HAVING signalCount > 1
            ORDER BY signalCount DESC
        `).all() as { targetTagCode: string; signalCount: number }[]

        if (aggregationStats.length > 0) {
            console.log('')
            console.log('📊 Multi-signal aggregation tags:')
            aggregationStats.forEach(stat => {
                console.log(`   • ${stat.targetTagCode}: ${stat.signalCount} signals aggregated`)
            })
        }

        console.log('')
        console.log('═══════════════════════════════════════════')
        console.log('🎉 Tags & Signals restoration completed!')
        console.log('═══════════════════════════════════════════')
        console.log('')
        console.log('📋 Summary:')
        console.log(`   • Tags restored: ${tagCountResult.count}`)
        console.log(`   • Signals restored: ${signalCountResult.count}`)
        console.log(`   • Orphan signals: ${orphanSignals.length}`)
        console.log('')

    } catch (error) {
        console.error('❌ Failed to restore tags & signals:', error)
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