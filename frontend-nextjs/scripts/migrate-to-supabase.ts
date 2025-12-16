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
    console.log('🚀 智能增量迁移开始 (Smart Sync)...\n');
    console.log('配置策略:')
    console.log('   - [全量] cfg_* (配置表)')
    console.log('   - [全量] biz_calls (本地通话数据)')
    console.log('   - [关联] biz_call_* (通话详情)')
    console.log('   - [关联] sync_agents (被引用坐席)')
    console.log('   - [跳过] log_* (日志)')
    console.log('   - [跳过] sync_deals, sync_transcripts (其他同步数据)\n')

    const client = await pgPool.connect();
    let total = 0;

    try {
        // 1. 获取核心驱动数据: biz_calls
        // 假设本地的 biz_calls 就是我们需要同步的那 "10条"（或当前开发集）
        const calls = sqlite.prepare('SELECT id, agent_id, started_at, duration, outcome, audio_url FROM biz_calls').all() as any[];
        const callIds = calls.map(c => c.id);
        const relatedAgentIds = [...new Set(calls.map(c => c.agent_id))];

        console.log(`📋 核心数据源: ${calls.length} 条通话记录\n`);

        // === 阶段 1: 基础依赖 (Agents) ===
        // 只同步被 biz_calls 引用的 agents，防止 FK 报错
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

        // === 阶段 2: 配置数据 (全量) ===
        console.log('📂 cfg_tags');
        const tags = sqlite.prepare('SELECT id, name, code, category, dimension, polarity, severity, score_range, description, active, created_at, updated_at, is_mandatory FROM cfg_tags').all() as any[];
        tags.forEach(t => { t.score_range = t.score_range || '0-5'; t.description = t.description || ''; t.is_mandatory = t.is_mandatory || false; });
        const tagCount = await batchInsert(client, 'cfg_tags', ['id', 'name', 'code', 'category', 'dimension', 'polarity', 'severity', 'score_range', 'description', 'active', 'created_at', 'updated_at', 'is_mandatory'], tags);
        console.log(`   ✅ ${tagCount} 行\n`);
        total += tagCount;

        console.log('📂 cfg_signals');
        const signals = sqlite.prepare('SELECT id, code, name, category, dimension, target_tag_code, aggregation_method, description, active, created_at, updated_at FROM cfg_signals').all() as any[];
        signals.forEach(s => { s.description = s.description || ''; });
        const sigCount = await batchInsert(client, 'cfg_signals', ['id', 'code', 'name', 'category', 'dimension', 'target_tag_code', 'aggregation_method', 'description', 'active', 'created_at', 'updated_at'], signals);
        console.log(`   ✅ ${sigCount} 行\n`);
        total += sigCount;

        console.log('📂 cfg_prompts');
        const prompts = sqlite.prepare('SELECT id, name, version, content, description, is_default, active, created_at, updated_at, prompt_type, variables, output_schema FROM cfg_prompts').all() as any[];
        const pCount = await batchInsert(client, 'cfg_prompts', ['id', 'name', 'version', 'content', 'description', 'is_default', 'active', 'created_at', 'updated_at', 'prompt_type', 'variables', 'output_schema'], prompts);
        console.log(`   ✅ ${pCount} 行\n`);
        total += pCount;

        console.log('📂 cfg_scoring_rules'); // 添加评分规则
        try {
            const rules = sqlite.prepare('SELECT id, name, applies_to, description, active, rule_type, tag_code, target_dimension, score_adjustment, weight, created_at, updated_at FROM cfg_scoring_rules').all() as any[];
            const rCount = await batchInsert(client, 'cfg_scoring_rules', ['id', 'name', 'applies_to', 'description', 'active', 'rule_type', 'tag_code', 'target_dimension', 'score_adjustment', 'weight', 'created_at', 'updated_at'], rules);
            console.log(`   ✅ ${rCount} 行\n`);
            total += rCount;
        } catch (e) { console.log('   ⚠️ cfg_scoring_rules 可能是空的或不存在，跳过\n'); }

        console.log('📂 cfg_score_config'); // 添加评分配置
        try {
            const configs = sqlite.prepare('SELECT id, aggregation_method, process_weight, skills_weight, communication_weight, custom_formula, description, created_at, updated_at FROM cfg_score_config').all() as any[];
            const cCount = await batchInsert(client, 'cfg_score_config', ['id', 'aggregation_method', 'process_weight', 'skills_weight', 'communication_weight', 'custom_formula', 'description', 'created_at', 'updated_at'], configs);
            console.log(`   ✅ ${cCount} 行\n`);
            total += cCount;
        } catch (e) { console.log('   ⚠️ cfg_score_config 可能是空的或不存在，跳过\n'); }


        // === 阶段 3: 业务数据 (基于 Calls 过滤) ===
        console.log('📂 biz_calls');
        // 数据已经在上面 fetch 过了，直接处理
        calls.forEach(c => { c.duration = c.duration || 0; c.outcome = c.outcome || 'unknown'; });
        const callCount = await batchInsert(client, 'biz_calls', ['id', 'agent_id', 'started_at', 'duration', 'outcome', 'audio_url'], calls);
        console.log(`   ✅ ${callCount} 行\n`);
        total += callCount;

        if (callIds.length > 0) {
            console.log('📂 biz_call_signals (关联同步)');
            const callSignals = sqlite.prepare(`
                SELECT id, call_id, signal_id, timestamp_sec, confidence, context_text, reasoning, created_at 
                FROM biz_call_signals 
                WHERE call_id IN (${callIds.map(() => '?').join(',')})
            `).all(...callIds) as any[];
            const csCount = await batchInsert(client, 'biz_call_signals', ['id', 'call_id', 'signal_id', 'timestamp_sec', 'confidence', 'context_text', 'reasoning', 'created_at'], callSignals);
            console.log(`   ✅ ${csCount} 行\n`);
            total += csCount;

            console.log('📂 biz_call_tags (关联同步)');
            const assessments = sqlite.prepare(`
                SELECT id, call_id, tag_id, score, confidence, context_text, timestamp_sec, reasoning, context_events, created_at 
                FROM biz_call_tags 
                WHERE call_id IN (${callIds.map(() => '?').join(',')})
            `).all(...callIds) as any[];
            assessments.forEach(a => { a.score = a.score || 0; });
            const aCount = await batchInsert(client, 'biz_call_tags', ['id', 'call_id', 'tag_id', 'score', 'confidence', 'context_text', 'timestamp_sec', 'reasoning', 'context_events', 'created_at'], assessments);
            console.log(`   ✅ ${aCount} 行\n`);
            total += aCount;
        }

    } finally {
        client.release();
    }

    console.log(`\n✨ 完成! 共同步 ${total} 行核心数据`);
    console.log(`⚠️ 已跳过: sync_deals, sync_transcripts, sync_ai_analysis, log_*`);
    sqlite.close();
    await pgPool.end();
}

migrate().catch(console.error);
