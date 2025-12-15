
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

async function fixConfigs() {
    console.log('🚀 补全配置表...');
    const client = await pgPool.connect();

    try {
        // 1. cfg_score_config
        console.log('📂 cfg_score_config');
        const configs = sqlite.prepare('SELECT id, aggregationMethod as aggregation_method, processWeight as process_weight, skillsWeight as skills_weight, communicationWeight as communication_weight, customFormula as custom_formula, description, createdAt as created_at, updatedAt as updated_at FROM cfg_score_config').all() as any[];

        for (const c of configs) {
            await client.query(
                `INSERT INTO cfg_score_config (id, aggregation_method, process_weight, skills_weight, communication_weight, custom_formula, description, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET process_weight = EXCLUDED.process_weight`,
                [c.id, c.aggregation_method, c.process_weight, c.skills_weight, c.communication_weight, c.custom_formula, c.description || '', c.created_at, c.updated_at]
            );
        }
        console.log(`   ✅ ${configs.length} 行`);

        // 2. cfg_scoring_rules
        console.log('📂 cfg_scoring_rules');
        const rules = sqlite.prepare('SELECT id, name, appliesTo as applies_to, description, active, ruleType as rule_type, tagCode as tag_code, targetDimension as target_dimension, scoreAdjustment as score_adjustment, weight, createdAt as created_at, updatedAt as updated_at FROM cfg_scoring_rules').all() as any[];

        for (const r of rules) {
            await client.query(
                `INSERT INTO cfg_scoring_rules (id, name, applies_to, description, active, rule_type, tag_code, target_dimension, score_adjustment, weight, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                [r.id, r.name, r.applies_to, r.description || '', r.active, r.rule_type, r.tag_code, r.target_dimension, r.score_adjustment, r.weight, r.created_at, r.updated_at]
            );
        }
        console.log(`   ✅ ${rules.length} 行`);

    } finally {
        client.release();
        await pgPool.end();
        sqlite.close();
    }
}

fixConfigs().catch(console.error);
