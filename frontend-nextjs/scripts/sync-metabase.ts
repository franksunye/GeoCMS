import 'dotenv/config';
import axios from 'axios';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Debug: Check where we are and if .env exists
console.log('Current working directory:', process.cwd());

const loadEnv = (filename: string) => {
  const envPath = path.join(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    console.log(`${filename} file found at:`, envPath);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
    return true;
  }
  return false;
};

// 加载环境变量：.env 先加载，.env.local 后加载并覆盖
const envLoaded = loadEnv('.env');
const envLocalLoaded = loadEnv('.env.local');

if (!envLoaded && !envLocalLoaded) {
  console.warn('Warning: Neither .env nor .env.local file found.');
} else {
  if (envLoaded) console.log('Loaded .env');
  if (envLocalLoaded) console.log('Loaded .env.local (override)');
}

// Configuration
const METABASE_URL = process.env.METABASE_URL || 'http://metabase.fsgo365.cn:3000';
const METABASE_USERNAME = process.env.METABASE_USERNAME;
const METABASE_PASSWORD = process.env.METABASE_PASSWORD;

console.log('Configuration loaded:');
console.log('- METABASE_URL:', METABASE_URL);
console.log('- METABASE_USERNAME:', METABASE_USERNAME ? '(set)' : '(not set)');
console.log('- METABASE_PASSWORD:', METABASE_PASSWORD ? '(set)' : '(not set)');

// Database Setup
const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);
// Disable foreign keys for sync process to allow independent table loading
db.pragma('foreign_keys = OFF');
console.log('Foreign keys disabled for sync process.');

// Types
interface MetabaseConfig {
  url: string;
  username: string;
  password: string;
}

interface SyncJob {
  cardId: number;
  tableName: string;
  mapping: Record<string, string>; // Metabase Column -> SQLite Column
}

// Sync Jobs Configuration
const SYNC_JOBS: SyncJob[] = [
  {
    // cardId: 1937, // AI Analysis Logs V1
    cardId: 1942, // AI Analysis Logs V2
    tableName: 'sync_ai_analysis',
    mapping: {
      '_id': 'id',
      'outId': 'transcript_id',
      'userId': 'agent_id',
      'serviceAppointmentId': 'deal_id',
      'orgId': 'team_id',
      'answer': 'signals',
      'createTime': 'created_at'
    }
  },
  {
    cardId: 1938, // audioURL & Transcripts
    tableName: 'sync_transcripts',
    mapping: {
      '_id': 'id',
      'serviceAppointmentId': 'deal_id',
      'userId': 'agent_id',
      'result': 'content',
      'sobotCallBack → recordUrl': 'audio_url',
      'createTime': 'created_at'
    }
  },
  {
    cardId: 1939, // Deals
    tableName: 'sync_deals',
    mapping: {
      '_id': 'id',
      'supervisorId': 'agent_id',
      'outcome': 'outcome',
      'orderNum': 'order_number', // 工单编号
      'IsOnsiteCompleted': 'is_onsite_completed', // 是否已上门: 1=已上门, 0=未上门
      'createTime': 'created_at'
    }
  },
  {
    cardId: 1940, // Agents
    tableName: 'sync_agents',
    mapping: {
      '_id': 'id',
      'name': 'name',
      'createTime': 'created_at',
      'orgId': 'team_id',
      'avatar': 'avatar_id' // Placeholder to trigger default value
    }
  },
  {
    cardId: 1943, // Contracts (合同)
    tableName: 'sync_contracts',
    mapping: {
      '_id': 'id',
      'serviceAppointmentId': 'deal_id',
      'serviceHousekeeperId': 'agent_id',
      'channel': 'channel',
      'orgId': 'team_id',
      'createTime': 'created_at',
      'signedDate': 'signed_at'
    }
  }
];

// 表名简写映射
const TABLE_ALIASES: Record<string, string> = {
  'ai': 'sync_ai_analysis',
  'analysis': 'sync_ai_analysis',
  'transcripts': 'sync_transcripts',
  'deals': 'sync_deals',
  'agents': 'sync_agents',
  'contracts': 'sync_contracts'
};

// 命令行参数解析
function parseArgs(): { tables: string[] | null; help: boolean; clean: boolean } {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    return { tables: null, help: true, clean: false };
  }

  const clean = args.includes('--clean') || args.includes('-c');

  const tablesIndex = args.findIndex(a => a === '--tables' || a === '-t');
  if (tablesIndex !== -1 && args[tablesIndex + 1]) {
    const tableNames = args[tablesIndex + 1].split(',').map(t => {
      const trimmed = t.trim().toLowerCase();
      return TABLE_ALIASES[trimmed] || `sync_${trimmed}`;
    });
    return { tables: tableNames, help: false, clean };
  }

  return { tables: null, help: false, clean };
}

function printHelp() {
  console.log(`
Usage: npx tsx scripts/sync-metabase.ts [options]

Options:
  --tables, -t <names>   只同步指定的表，多个表用逗号分隔
  --clean, -c            同步前先清空表数据（完全同步模式）
  --help, -h             显示帮助信息

可用的表名 (支持简写):
  ai, analysis    -> sync_ai_analysis
  transcripts     -> sync_transcripts
  deals           -> sync_deals
  agents          -> sync_agents
  contracts       -> sync_contracts

示例:
  npx tsx scripts/sync-metabase.ts                    # 同步所有表 (增量)
  npx tsx scripts/sync-metabase.ts -t ai              # 只同步 AI 分析
  npx tsx scripts/sync-metabase.ts -t deals --clean   # 清空并完全同步 deals
  npx tsx scripts/sync-metabase.ts -t ai,agents -c    # 清空并完全同步多个表
`);
}


class MetabaseSync {
  private token: string | null = null;

  constructor(private config: MetabaseConfig) { }

  async login() {
    console.log('Logging in to Metabase...');
    try {
      const response = await axios.post(`${this.config.url}/api/session`, {
        username: this.config.username,
        password: this.config.password
      }, {
        proxy: false // Disable proxy to avoid local dev proxy issues
      });
      this.token = response.data.id;
      console.log('Login successful.');
    } catch (error) {
      console.error('Login failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async fetchCardData(cardId: number) {
    if (!this.token) await this.login();

    console.log(`Fetching data for Card ${cardId}...`);
    try {
      const response = await axios.post(
        `${this.config.url}/api/card/${cardId}/query/json`,
        { parameters: [] },
        {
          headers: { 'X-Metabase-Session': this.token },
          proxy: false
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch card ${cardId}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }
}

async function runSync() {
  const { tables: selectedTables, help, clean } = parseArgs();

  if (help) {
    printHelp();
    process.exit(0);
  }

  if (!METABASE_USERNAME || !METABASE_PASSWORD) {
    console.error('Please set METABASE_USERNAME and METABASE_PASSWORD in .env file');
    process.exit(1);
  }

  // 过滤要执行的同步任务
  const jobsToRun = selectedTables
    ? SYNC_JOBS.filter(job => selectedTables.includes(job.tableName))
    : SYNC_JOBS;

  if (jobsToRun.length === 0) {
    console.error('No matching sync jobs found for the specified tables.');
    console.log('Available tables:', SYNC_JOBS.map(j => j.tableName).join(', '));
    process.exit(1);
  }

  console.log(`\nSync targets: ${jobsToRun.map(j => j.tableName).join(', ')}`);
  console.log(`Sync mode: ${clean ? '❗ CLEAN (先清空再同步)' : '➕ UPSERT (增量同步)'}`);
  console.log('='.repeat(60));

  const metabase = new MetabaseSync({
    url: METABASE_URL,
    username: METABASE_USERNAME,
    password: METABASE_PASSWORD
  });

  for (const job of jobsToRun) {
    try {
      const data = await metabase.fetchCardData(job.cardId);

      if (!Array.isArray(data)) {
        console.error(`Unexpected data format for card ${job.cardId}. Expected array.`);
        continue;
      }

      console.log(`Syncing ${data.length} rows to ${job.tableName}...`);

      // Clean mode: 先清空表数据
      if (clean) {
        const deleteStmt = db.prepare(`DELETE FROM ${job.tableName}`);
        const deleteResult = deleteStmt.run();
        console.log(`❗ Cleaned ${job.tableName}: deleted ${deleteResult.changes} rows`);
      }

      const insertStmt = prepareInsertStatement(job.tableName, job.mapping);

      let inserted = 0;
      let skipped = 0;

      const transaction = db.transaction((rows: any[]) => {
        let idx = 0;
        for (const row of rows) {
          idx++;
          try {
            const params: Record<string, any> = {};
            for (const [mbCol, dbCol] of Object.entries(job.mapping)) {
              let value = row[mbCol];

              if (dbCol === 'signals') {
                if (value === undefined || value === null) {
                  value = '[]';
                } else if (typeof value !== 'string') {
                  value = JSON.stringify(value);
                }
              }

              if (dbCol === 'transcript_id' && (value === undefined || value === null)) {
                value = 'unknown';
              }

              if (dbCol === 'avatar_id' && (value === undefined || value === null)) {
                value = 'default-avatar';
              }

              if (dbCol === 'content') {
                if (value === undefined || value === null) {
                  value = '';
                } else if (typeof value !== 'string') {
                  value = JSON.stringify(value);
                }
              }

              // Handle channel field (may be array like ["46","4610","4610010"])
              if (dbCol === 'channel') {
                if (value === undefined || value === null) {
                  value = null;
                } else if (typeof value !== 'string') {
                  value = JSON.stringify(value);
                }
              }

              params[dbCol] = value;
            }

            if (idx === 1) {
              console.log('Sample row (mapped):', params);
              console.log('Sample row (raw):', row);
            }

            // Check required fields (PK)
            if (!params['id']) {
              console.warn('Skipping row missing ID');
              continue;
            }

            // Specific check for transcripts
            if (job.tableName === 'sync_transcripts' && !params['deal_id']) {
              // console.warn('Skipping transcript missing deal_id');
              continue;
            }

            // Specific check for deals
            if (job.tableName === 'sync_deals' && !params['agent_id']) {
              console.warn('Skipping deal missing agent_id (supervisorId)');
              continue;
            }

            const result = insertStmt.run(params);
            if (result.changes > 0) inserted++;
            else skipped++;

          } catch (err) {
            console.error('Error inserting row:', err);
          }
        }
      });

      transaction(data);
      console.log(`Job ${job.tableName} completed. Inserted: ${inserted}, Skipped (Duplicate): ${skipped}`);

    } catch (error) {
      console.error(`Error executing job for ${job.tableName}:`, error);
    }
  }
}

function prepareInsertStatement(tableName: string, mapping: Record<string, string>) {
  const dbCols = Object.values(mapping);
  const placeholders = dbCols.map(col => `@${col}`).join(', ');
  const columns = dbCols.join(', ');

  // Use INSERT OR REPLACE to handle updates (e.g. new fields like teamId, or status changes)
  const sql = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
  return db.prepare(sql);
}

runSync().catch(console.error);
