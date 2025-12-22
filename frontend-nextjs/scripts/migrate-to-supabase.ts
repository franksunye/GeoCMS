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
async function batchInsert(client: pg.PoolClient, table: string, columns: string[], rows: any[], batchSize = 50, primaryKey = 'id') {
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

        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} ON CONFLICT (${primaryKey}) DO NOTHING`;

        try {
            const result = await client.query(sql, values);
            inserted += result.rowCount || 0;
        } catch (e: any) {
            // 如果批量失败，逐行尝试
            for (const row of batch) {
                try {
                    const singlePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    await client.query(
                        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${singlePlaceholders}) ON CONFLICT (${primaryKey}) DO NOTHING`,
                        columns.map(c => row[c])
                    );
                    inserted++;
                } catch { }
            }
        }
    }
    return inserted;
}

// 简易参数解析
function parseArgs() {
    const args = process.argv.slice(2);
    const tablesIndex = args.findIndex(a => a === '--tables' || a === '-t');
    let targetTables: string[] | null = null;

    if (tablesIndex !== -1 && args[tablesIndex + 1]) {
        targetTables = args[tablesIndex + 1].split(',').map(t => t.trim());
    }
    return { targetTables };
}

async function migrate() {
    const { targetTables } = parseArgs();

    console.log('🚀 智能增量迁移开始 (Smart Sync)...\n');
    if (targetTables) {
        console.log(`🎯 仅同步指定表: ${targetTables.join(', ')}\n`);
    } else {
        console.log('配置策略: 全量同步所有关联数据\n');
    }

    const client = await pgPool.connect();
    let total = 0;

    // Helper to check if a table should be synced
    const shouldSync = (tableName: string) => {
        if (!targetTables) return true;
        return targetTables.includes(tableName);
    };

    try {
        // 1. 获取核心驱动数据: biz_calls
        // 始终需要获取 biz_calls 以确定要同步哪些关联数据 (e.g. deals that belong to these calls)
        const calls = sqlite.prepare('SELECT id, agent_id, started_at, duration, outcome, audio_url FROM biz_calls').all() as any[];
        const callIds = calls.map(c => c.id);
        const relatedAgentIds = [...new Set(calls.map(c => c.agent_id))];

        console.log(`📋 核心数据源: ${calls.length} 条通话记录 (用于计算关联)\n`);

        // === 阶段 1: 基础依赖 (Agents) ===
        if (shouldSync('sync_agents')) {
            console.log('📂 sync_agents (关联同步)');
            if (relatedAgentIds.length > 0) {
                const agents = sqlite.prepare(`
                    SELECT id, name, avatar_id, created_at, team_id 
                    FROM sync_agents 
                    WHERE id IN (${relatedAgentIds.map(() => '?').join(',')})
                `).all(...relatedAgentIds) as any[];

                agents.forEach(a => {
                    a.avatar_id = a.avatar_id || 'default-avatar';
                    a.name = a.name || 'Unknown';
                    a.created_at = a.created_at || new Date().toISOString();
                });
                const agentCount = await batchInsert(client, 'sync_agents', ['id', 'name', 'avatar_id', 'created_at', 'team_id'], agents);
                console.log(`   ✅ ${agentCount} 行 (关联坐席)\n`);
                total += agentCount;
            } else {
                console.log(`   ⚠️ 无关联坐席，跳过\n`);
            }
        }

        // === 阶段 2: 配置数据 (全量) ===
        if (shouldSync('cfg_tags')) {
            console.log('📂 cfg_tags');
            const tags = sqlite.prepare('SELECT code, name, category, dimension, polarity, severity, score_range, description, active, created_at, updated_at, is_mandatory FROM cfg_tags').all() as any[];
            tags.forEach(t => { t.score_range = t.score_range || '0-5'; t.description = t.description || ''; t.is_mandatory = t.is_mandatory || false; });
            const tagCount = await batchInsert(client, 'cfg_tags', ['code', 'name', 'category', 'dimension', 'polarity', 'severity', 'score_range', 'description', 'active', 'created_at', 'updated_at', 'is_mandatory'], tags, 50, 'code');
            console.log(`   ✅ ${tagCount} 行\n`);
            total += tagCount;
        }

        if (shouldSync('cfg_signals')) {
            console.log('📂 cfg_signals');
            const signals = sqlite.prepare('SELECT code, name, category, dimension, target_tag_code, aggregation_method, description, active, created_at, updated_at FROM cfg_signals').all() as any[];
            signals.forEach(s => { s.description = s.description || ''; });
            const sigCount = await batchInsert(client, 'cfg_signals', ['code', 'name', 'category', 'dimension', 'target_tag_code', 'aggregation_method', 'description', 'active', 'created_at', 'updated_at'], signals, 50, 'code');
            console.log(`   ✅ ${sigCount} 行\n`);
            total += sigCount;
        }

        if (shouldSync('cfg_prompts')) {
            console.log('📂 cfg_prompts');
            const prompts = sqlite.prepare('SELECT id, name, version, content, description, is_default, active, created_at, updated_at, prompt_type, variables, output_schema FROM cfg_prompts').all() as any[];
            const pCount = await batchInsert(client, 'cfg_prompts', ['id', 'name', 'version', 'content', 'description', 'is_default', 'active', 'created_at', 'updated_at', 'prompt_type', 'variables', 'output_schema'], prompts);
            console.log(`   ✅ ${pCount} 行\n`);
            total += pCount;
        }

        if (shouldSync('cfg_scoring_rules')) {
            console.log('📂 cfg_scoring_rules'); // 添加评分规则
            try {
                const rules = sqlite.prepare('SELECT id, name, applies_to, description, active, rule_type, tag_code, target_dimension, score_adjustment, weight, created_at, updated_at FROM cfg_scoring_rules').all() as any[];
                const rCount = await batchInsert(client, 'cfg_scoring_rules', ['id', 'name', 'applies_to', 'description', 'active', 'rule_type', 'tag_code', 'target_dimension', 'score_adjustment', 'weight', 'created_at', 'updated_at'], rules);
                console.log(`   ✅ ${rCount} 行\n`);
                total += rCount;
            } catch (e) { console.log('   ⚠️ cfg_scoring_rules 可能是空的或不存在，跳过\n'); }
        }

        if (shouldSync('cfg_score_config')) {
            console.log('📂 cfg_score_config'); // 添加评分配置
            try {
                const configs = sqlite.prepare('SELECT id, aggregation_method, process_weight, skills_weight, communication_weight, custom_formula, description, created_at, updated_at FROM cfg_score_config').all() as any[];
                const cCount = await batchInsert(client, 'cfg_score_config', ['id', 'aggregation_method', 'process_weight', 'skills_weight', 'communication_weight', 'custom_formula', 'description', 'created_at', 'updated_at'], configs);
                console.log(`   ✅ ${cCount} 行\n`);
                total += cCount;
            } catch (e) { console.log('   ⚠️ cfg_score_config 可能是空的或不存在，跳过\n'); }
        }


        // === 阶段 3: 业务数据 (基于 Calls 过滤) ===
        if (shouldSync('biz_calls')) {
            console.log('📂 biz_calls');
            // 数据已经在上面 fetch 过了，直接处理
            calls.forEach(c => { c.duration = c.duration || 0; c.outcome = c.outcome || 'unknown'; });
            const callCount = await batchInsert(client, 'biz_calls', ['id', 'agent_id', 'started_at', 'duration', 'outcome', 'audio_url'], calls);
            console.log(`   ✅ ${callCount} 行\n`);
            total += callCount;
        }

        if (callIds.length > 0) {
            if (shouldSync('biz_call_signals')) {
                console.log('📂 biz_call_signals (关联同步)');
                const callSignals = sqlite.prepare(`
                    SELECT id, call_id, signal_id, timestamp_sec, confidence, context_text, reasoning, created_at 
                    FROM biz_call_signals 
                    WHERE call_id IN (${callIds.map(() => '?').join(',')})
                `).all(...callIds) as any[];
                const csCount = await batchInsert(client, 'biz_call_signals', ['id', 'call_id', 'signal_id', 'timestamp_sec', 'confidence', 'context_text', 'reasoning', 'created_at'], callSignals);
                console.log(`   ✅ ${csCount} 行\n`);
                total += csCount;
            }

            if (shouldSync('biz_call_tags')) {
                console.log('📂 biz_call_tags (关联同步)');
                const tagsData = sqlite.prepare(`
                    SELECT id, call_id, tag_id, score, confidence, context_text, timestamp_sec, reasoning, context_events, created_at 
                    FROM biz_call_tags 
                    WHERE call_id IN (${callIds.map(() => '?').join(',')})
                `).all(...callIds) as any[];
                tagsData.forEach(a => { a.score = a.score || 0; });
                const aCount = await batchInsert(client, 'biz_call_tags', ['id', 'call_id', 'tag_id', 'score', 'confidence', 'context_text', 'timestamp_sec', 'reasoning', 'context_events', 'created_at'], tagsData);
                console.log(`   ✅ ${aCount} 行 (关联标签)\n`);
                total += aCount;
            }

            // 新增: 同步关联的 deals (满足 transcript 外键约束)
            if (shouldSync('sync_deals')) {
                console.log('📂 sync_deals (关联同步)');
                try {
                    const deals = sqlite.prepare(`
                        SELECT id, agent_id, outcome, order_number, is_onsite_completed, leak_area, created_at 
                        FROM sync_deals 
                        WHERE id IN (${callIds.map(() => '?').join(',')})
                    `).all(...callIds) as any[];

                    deals.forEach(d => {
                        d.outcome = d.outcome || 'unknown';
                        d.is_onsite_completed = d.is_onsite_completed ?? 0;
                    });

                    const dealCount = await batchInsert(client, 'sync_deals', ['id', 'agent_id', 'outcome', 'order_number', 'is_onsite_completed', 'leak_area', 'created_at'], deals);
                    console.log(`   ✅ ${dealCount} 行\n`);
                    total += dealCount;
                } catch (e) {
                    console.log('   ⚠️ 同步 deals 失败或无数据:', e);
                }
            }

            // 新增: 同步关联的 transcripts (deal_id = call_id)
            if (shouldSync('sync_transcripts')) {
                console.log('📂 sync_transcripts (关联同步)');
                try {
                    const transcripts = sqlite.prepare(`
                        SELECT id, deal_id, agent_id, content, created_at, audio_url 
                        FROM sync_transcripts 
                        WHERE deal_id IN (${callIds.map(() => '?').join(',')})
                    `).all(...callIds) as any[];

                    transcripts.forEach(t => {
                        t.content = t.content || '';
                        t.audio_url = t.audio_url || '';
                    });

                    const transCount = await batchInsert(client, 'sync_transcripts', ['id', 'deal_id', 'agent_id', 'content', 'created_at', 'audio_url'], transcripts);
                    console.log(`   ✅ ${transCount} 行\n`);
                    total += transCount;
                } catch (e) {
                    console.log('   ⚠️ 同步 transcript 失败或无数据:', e);
                }
            }
        }

    } finally {
        client.release();
    }

    console.log(`\n✨ 完成! 共同步 ${total} 行核心数据`);
    sqlite.close();
    await pgPool.end();
}

migrate().catch(console.error);
