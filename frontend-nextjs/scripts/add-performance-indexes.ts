/**
 * Performance Indexes Migration Script
 * 
 * 为数据库添加性能优化索引
 * 
 * 缺失的关键索引：
 * 1. biz_call_tags (call_id, tag_id) - 用于 Call List 和 Scorecard 查询
 * 2. biz_calls (started_at, agent_id) - 用于时间范围过滤和坐席查询
 * 
 * 使用方式:
 *   npx ts-node scripts/add-performance-indexes.ts
 */

import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'team-calls.db')

const INDEXES = [
    // biz_call_tags 表索引
    {
        name: 'idx_biz_call_tags_call_id',
        table: 'biz_call_tags',
        column: 'call_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_biz_call_tags_call_id ON biz_call_tags(call_id)'
    },
    {
        name: 'idx_biz_call_tags_tag_id',
        table: 'biz_call_tags',
        column: 'tag_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_biz_call_tags_tag_id ON biz_call_tags(tag_id)'
    },
    // biz_calls 表索引
    {
        name: 'idx_biz_calls_started_at',
        table: 'biz_calls',
        column: 'started_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_biz_calls_started_at ON biz_calls(started_at)'
    },
    {
        name: 'idx_biz_calls_agent_id',
        table: 'biz_calls',
        column: 'agent_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_biz_calls_agent_id ON biz_calls(agent_id)'
    },
    // 复合索引 - 用于按时间和坐席筛选
    {
        name: 'idx_biz_calls_agent_started',
        table: 'biz_calls',
        column: 'agent_id, started_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_biz_calls_agent_started ON biz_calls(agent_id, started_at)'
    }
]

async function main() {
    console.log('='.repeat(60))
    console.log('Performance Indexes Migration')
    console.log('='.repeat(60))
    console.log(`Database: ${DB_PATH}\n`)

    const db = new Database(DB_PATH)

    // 1. 查看当前索引
    console.log('📋 Current Indexes:')
    const existingIndexes = db.prepare(`
    SELECT name, tbl_name as table_name 
    FROM sqlite_master 
    WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
    ORDER BY tbl_name, name
  `).all() as { name: string; table_name: string }[]

    if (existingIndexes.length === 0) {
        console.log('   (No custom indexes found)')
    } else {
        existingIndexes.forEach(idx => {
            console.log(`   - ${idx.table_name}.${idx.name}`)
        })
    }
    console.log()

    // 2. 添加缺失的索引
    console.log('🚀 Adding Performance Indexes:')
    let addedCount = 0
    let skippedCount = 0

    for (const index of INDEXES) {
        const exists = existingIndexes.some(e => e.name === index.name)

        if (exists) {
            console.log(`   ⏭️  ${index.name} (already exists)`)
            skippedCount++
        } else {
            try {
                db.exec(index.sql)
                console.log(`   ✅ ${index.name} on ${index.table}(${index.column})`)
                addedCount++
            } catch (error) {
                console.error(`   ❌ ${index.name}: ${error}`)
            }
        }
    }

    console.log()
    console.log('='.repeat(60))
    console.log(`Summary: ${addedCount} added, ${skippedCount} skipped`)
    console.log('='.repeat(60))

    // 3. 验证新索引
    console.log('\n📋 Final Index List:')
    const finalIndexes = db.prepare(`
    SELECT name, tbl_name as table_name 
    FROM sqlite_master 
    WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
    ORDER BY tbl_name, name
  `).all() as { name: string; table_name: string }[]

    finalIndexes.forEach(idx => {
        console.log(`   - ${idx.table_name}.${idx.name}`)
    })

    // 4. 运行 ANALYZE 更新统计信息
    console.log('\n🔄 Running ANALYZE to update statistics...')
    db.exec('ANALYZE')
    console.log('   ✅ Statistics updated')

    db.close()
    console.log('\n✅ Migration complete!')
}

main().catch(console.error)
