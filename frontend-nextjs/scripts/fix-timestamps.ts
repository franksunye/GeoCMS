
import 'dotenv/config';
import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

const SQLITE_PATH = path.join(process.cwd(), 'team-calls.db');
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL || !fs.existsSync(SQLITE_PATH)) {
    console.error('❌ 配置缺失或数据库文件不存在');
    process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pgPool = new Pool({ connectionString: PG_URL });

async function fixTimestamps() {
    console.log('🚀 开始修复 timestamp_sec 字段...\n');
    const client = await pgPool.connect();

    try {
        // 1. 修复 biz_call_signals
        console.log('📂 正在修复 biz_call_signals...');
        const signals = sqlite.prepare('SELECT id, timestamp_sec FROM biz_call_signals').all() as any[];
        let updatedSignals = 0;

        for (const s of signals) {
            // 只在 timestamp_sec 有值时更新
            if (s.timestamp_sec !== undefined && s.timestamp_sec !== null) {
                await client.query(
                    'UPDATE biz_call_signals SET timestamp_sec = $1 WHERE id = $2',
                    [s.timestamp_sec, s.id]
                );
                updatedSignals++;
            }
        }
        console.log(`   ✅ 更新了 ${updatedSignals} 行\n`);

        // 2. 修复 biz_call_assessments
        console.log('📂 正在修复 biz_call_assessments...');
        const assessments = sqlite.prepare('SELECT id, timestamp_sec FROM biz_call_assessments').all() as any[];
        let updatedAssessments = 0;

        for (const a of assessments) {
            // 只在 timestamp_sec 有值时更新
            if (a.timestamp_sec !== undefined && a.timestamp_sec !== null) {
                await client.query(
                    'UPDATE biz_call_assessments SET timestamp_sec = $1 WHERE id = $2',
                    [a.timestamp_sec, a.id]
                );
                updatedAssessments++;
            }
        }
        console.log(`   ✅ 更新了 ${updatedAssessments} 行\n`);

    } catch (e) {
        console.error('❌ 修复过程中出错:', e);
    } finally {
        client.release();
        await pgPool.end();
        sqlite.close();
    }
    console.log('✨ 修复完成！');
}

fixTimestamps();
