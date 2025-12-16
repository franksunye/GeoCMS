/**
 * 数据迁移脚本：SQLite -> Supabase PostgreSQL (批量版)
 * 使用批量插入而不是逐行插入，速度快 10x+
 * 
 * 注意：SQLite 和 PostgreSQL 现在使用相同的 snake_case 列名，无需转换
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

const SQLITE_PATH = path.join(process.cwd(), 'team-calls.db');
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL || !fs.existsSync(SQLITE_PATH)) {
    console.error('❌ 缺少配置');
    process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pgPool = new Pool({ connectionString: PG_URL });

// 批量插入辅助函数
async function batchInsert(client: pg.PoolClient, table: string, columns: string[], rows: any[], batchSize = 50) {
    if (rows.length === 0) return 0;

    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values: any[] = [];
        const placeholders: string[] = [];

        batch.forEach((row, idx) => {
            const rowPlaceholders = columns.map((_, colIdx) => `$${idx * columns.length + colIdx + 1}`);
            placeholders.push(`(${rowPlaceholders.join(', ')})`);
            columns.forEach(col => values.push(row[col]));
        });

        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} ON CONFLICT (id) DO NOTHING`;

        try {
            const result = await client.query(sql, values);
            inserted += result.rowCount || 0;
        } catch (e: any) {
            // 如果批量失败，逐行尝试
            for (const row of batch) {
                try {
                    const singlePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    await client.query(
                        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${singlePlaceholders}) ON CONFLICT (id) DO NOTHING`,
                        columns.map(c => row[c])
                    );
                    inserted++;
                } catch { }
            }
        }
    }
    return inserted;
}

async function migrate() {
    console.log('🚀 批量迁移开始...\n');
    const client = await pgPool.connect();
    let total = 0;

    try {
        // 获取 biz_calls 中的 call IDs
        const calls = sqlite.prepare('SELECT id, agent_id FROM biz_calls').all() as any[];
        const callIds = calls.map(c => c.id);
        const agentIds = [...new Set(calls.map(c => c.agent_id))];

        console.log(`📋 基于 ${calls.length} 条 biz_calls\n`);

        // 1. sync_agents
        console.log('📂 sync_agents');
        const agents = sqlite.prepare(`SELECT id, name, avatar_id, created_at, team_id FROM sync_agents WHERE id IN (${agentIds.map(() => '?').join(',')})`).all(...agentIds) as any[];
        agents.forEach(a => { a.avatar_id = a.avatar_id || 'default-avatar'; a.name = a.name || 'Unknown'; a.created_at = a.created_at || new Date().toISOString(); });
        const agentCount = await batchInsert(client, 'sync_agents', ['id', 'name', 'avatar_id', 'created_at', 'team_id'], agents);
        console.log(`   ✅ ${agentCount} 行\n`);
        total += agentCount;

        // 2. sync_deals - 只按 call IDs 查 (dealId = callId)
        console.log('📂 sync_deals');
        const deals = sqlite.prepare(`SELECT id, agent_id, outcome, created_at FROM sync_deals WHERE id IN (${callIds.map(() => '?').join(',')})`).all(...callIds) as any[];
        deals.forEach(d => { d.outcome = d.outcome || 'unknown'; });
        const dealCount = await batchInsert(client, 'sync_deals', ['id', 'agent_id', 'outcome', 'created_at'], deals);
        console.log(`   ✅ ${dealCount} 行\n`);
        total += dealCount;

        // 3. sync_transcripts - 只按 call IDs 查
        console.log('📂 sync_transcripts');
        const transcripts = sqlite.prepare(`SELECT id, deal_id, agent_id, content, created_at, audio_url FROM sync_transcripts WHERE deal_id IN (${callIds.map(() => '?').join(',')})`).all(...callIds) as any[];
        transcripts.forEach(t => { t.content = t.content || ''; });
        const transCount = await batchInsert(client, 'sync_transcripts', ['id', 'deal_id', 'agent_id', 'content', 'created_at', 'audio_url'], transcripts);
        console.log(`   ✅ ${transCount} 行\n`);
        total += transCount;

        // 4. cfg_tags
        console.log('📂 cfg_tags');
        const tags = sqlite.prepare('SELECT id, name, code, category, dimension, polarity, severity, score_range, description, active, created_at, updated_at, is_mandatory FROM cfg_tags').all() as any[];
        tags.forEach(t => { t.score_range = t.score_range || '0-5'; t.description = t.description || ''; t.is_mandatory = t.is_mandatory || false; });
        const tagCount = await batchInsert(client, 'cfg_tags', ['id', 'name', 'code', 'category', 'dimension', 'polarity', 'severity', 'score_range', 'description', 'active', 'created_at', 'updated_at', 'is_mandatory'], tags);
        console.log(`   ✅ ${tagCount} 行\n`);
        total += tagCount;

        // 5. cfg_signals
        console.log('📂 cfg_signals');
        const signals = sqlite.prepare('SELECT id, code, name, category, dimension, target_tag_code, aggregation_method, description, active, created_at, updated_at FROM cfg_signals').all() as any[];
        signals.forEach(s => { s.description = s.description || ''; });
        const sigCount = await batchInsert(client, 'cfg_signals', ['id', 'code', 'name', 'category', 'dimension', 'target_tag_code', 'aggregation_method', 'description', 'active', 'created_at', 'updated_at'], signals);
        console.log(`   ✅ ${sigCount} 行\n`);
        total += sigCount;

        // 6. biz_calls
        console.log('📂 biz_calls');
        const bizCalls = sqlite.prepare('SELECT id, agent_id, started_at, duration, outcome, audio_url FROM biz_calls').all() as any[];
        bizCalls.forEach(c => { c.duration = c.duration || 0; c.outcome = c.outcome || 'unknown'; });
        const callCount = await batchInsert(client, 'biz_calls', ['id', 'agent_id', 'started_at', 'duration', 'outcome', 'audio_url'], bizCalls);
        console.log(`   ✅ ${callCount} 行\n`);
        total += callCount;

        // 7. biz_call_signals (已统一 Schema：signal_code → signal_id 外键)
        console.log('📂 biz_call_signals');
        const callSignals = sqlite.prepare('SELECT id, call_id, signal_id, timestamp_sec, confidence, context_text, reasoning, created_at FROM biz_call_signals').all() as any[];
        const csCount = await batchInsert(client, 'biz_call_signals', ['id', 'call_id', 'signal_id', 'timestamp_sec', 'confidence', 'context_text', 'reasoning', 'created_at'], callSignals);
        console.log(`   ✅ ${csCount} 行\n`);
        total += csCount;

        // 8. biz_call_tags (已统一 Schema：timestamp_sec 改为 REAL，添加 created_at)
        console.log('📂 biz_call_tags');
        const assessments = sqlite.prepare('SELECT id, call_id, tag_id, score, confidence, context_text, timestamp_sec, reasoning, context_events, created_at FROM biz_call_tags').all() as any[];
        assessments.forEach(a => { a.score = a.score || 0; });
        const aCount = await batchInsert(client, 'biz_call_tags', ['id', 'call_id', 'tag_id', 'score', 'confidence', 'context_text', 'timestamp_sec', 'reasoning', 'context_events', 'created_at'], assessments);
        console.log(`   ✅ ${aCount} 行\n`);
        total += aCount;

        // 9. cfg_prompts
        console.log('📂 cfg_prompts');
        const prompts = sqlite.prepare('SELECT id, name, version, content, description, is_default, active, created_at, updated_at, prompt_type, variables, output_schema FROM cfg_prompts').all() as any[];
        const pCount = await batchInsert(client, 'cfg_prompts', ['id', 'name', 'version', 'content', 'description', 'is_default', 'active', 'created_at', 'updated_at', 'prompt_type', 'variables', 'output_schema'], prompts);
        console.log(`   ✅ ${pCount} 行\n`);
        total += pCount;

    } finally {
        client.release();
    }

    console.log(`\n✨ 完成! 共 ${total} 行`);
    sqlite.close();
    await pgPool.end();
}

migrate().catch(console.error);
