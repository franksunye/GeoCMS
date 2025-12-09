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

if (!loadEnv('.env')) {
  console.warn('Warning: .env file not found.');
  if (loadEnv('.env.local')) {
    console.log('Loaded .env.local instead.');
  } else {
    console.warn('Warning: .env.local file also not found.');
  }
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
    tableName: 'ai_analysis_logs',
    mapping: {
      '_id': 'id',
      'outId': 'transcriptId',
      'userId': 'agentId',
      'serviceAppointmentId': 'dealId',
      'orgId': 'teamId',
      'answer': 'signals',
      'createTime': 'createdAt'
    }
  },
  {
    cardId: 1938, // audioURL & Transcripts
    tableName: 'transcripts',
    mapping: {
      '_id': 'id',
      'serviceAppointmentId': 'dealId',
      'userId': 'agentId',
      'result': 'content',
      'sobotCallBack → recordUrl': 'audioUrl',
      'createTime': 'createdAt'
    }
  },
  // {
  //   cardId: 1939, // Deals
  //   tableName: 'deals',
  //   mapping: {
  //     '_id': 'id',
  //     'supervisorId': 'agentId',
  //     'outcome': 'outcome',
  //     'createTime': 'createdAt'
  //   }
  // },
  // {
  //   cardId: 1940, // Agents
  //   tableName: 'agents',
  //   mapping: {
  //     '_id': 'id',
  //     'name': 'name',
  //     'createTime': 'createdAt',
  //     'orgId': 'teamId',
  //     'avatar': 'avatarId' // Placeholder to trigger default value
  //   }
  // }
];


class MetabaseSync {
  private token: string | null = null;

  constructor(private config: MetabaseConfig) {}

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
  if (!METABASE_USERNAME || !METABASE_PASSWORD) {
    console.error('Please set METABASE_USERNAME and METABASE_PASSWORD in .env file');
    process.exit(1);
  }

  const metabase = new MetabaseSync({
    url: METABASE_URL,
    username: METABASE_USERNAME,
    password: METABASE_PASSWORD
  });

  for (const job of SYNC_JOBS) {
    try {
      const data = await metabase.fetchCardData(job.cardId);
      
      if (!Array.isArray(data)) {
        console.error(`Unexpected data format for card ${job.cardId}. Expected array.`);
        continue;
      }

      console.log(`Syncing ${data.length} rows to ${job.tableName}...`);
      
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
              
              if (dbCol === 'transcriptId' && (value === undefined || value === null)) {
                  value = 'unknown';
              }

              if (dbCol === 'avatarId' && (value === undefined || value === null)) {
                  value = 'default-avatar';
              }

              if (dbCol === 'content') {
                  if (value === undefined || value === null) {
                      value = '';
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
            if (job.tableName === 'transcripts' && !params['dealId']) {
               // console.warn('Skipping transcript missing dealId');
               continue;
            }

            // Specific check for deals
            if (job.tableName === 'deals' && !params['agentId']) {
               console.warn('Skipping deal missing agentId (supervisorId)');
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
