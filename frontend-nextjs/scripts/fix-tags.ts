
import 'dotenv/config';
import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

const SQLITE_PATH = path.join(process.cwd(), 'team-calls.db');
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL || !fs.existsSync(SQLITE_PATH)) {
    console.error('❌ 配置缺失');
    process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pgPool = new Pool({ connectionString: PG_URL });

async function fixTags() {
    console.log('🚀 重新同步 cfg_tags...');
    const client = await pgPool.connect();

    try {
        const tags = sqlite.prepare('SELECT id, name, code, category, dimension, polarity, severity, scoreRange as score_range, description, active, createdAt as created_at, updatedAt as updated_at, is_mandatory FROM cfg_tags').all() as any[];

        let count = 0;
        for (const t of tags) {
            await client.query(
                `INSERT INTO cfg_tags (id, name, code, category, dimension, polarity, severity, score_range, description, active, created_at, updated_at, is_mandatory) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    code = EXCLUDED.code,
                    category = EXCLUDED.category,
                    dimension = EXCLUDED.dimension,
                    polarity = EXCLUDED.polarity,
                    is_mandatory = EXCLUDED.is_mandatory`,
                [t.id, t.name, t.code, t.category, t.dimension, t.polarity, t.severity, t.score_range || '0-5', t.description || '', t.active, t.created_at, t.updated_at, t.is_mandatory || false]
            );
            count++;
        }
        console.log(`✅ 已更新 ${count} 个标签`);
    } finally {
        client.release();
        await pgPool.end();
        sqlite.close();
    }
}

fixTags().catch(console.error);
