
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

function checkOrphans(childTable: string, fkCol: string, parentTable: string, parentCol: string = 'id') {
  try {
    const sql = `
      SELECT count(*) as count 
      FROM ${childTable} c 
      LEFT JOIN ${parentTable} p ON c.${fkCol} = p.${parentCol} 
      WHERE p.${parentCol} IS NULL AND c.${fkCol} IS NOT NULL AND c.${fkCol} != ''
    `;
    const result = db.prepare(sql).get() as { count: number };
    
    const totalSql = `SELECT count(*) as count FROM ${childTable}`;
    const total = db.prepare(totalSql).get() as { count: number };
    
    const percentage = total.count > 0 ? ((result.count / total.count) * 100).toFixed(2) : '0.00';
    
    console.log(`[FK Check] ${childTable}.${fkCol} -> ${parentTable}.${parentCol}: ${result.count} orphans out of ${total.count} rows (${percentage}%)`);
    return { orphans: result.count, total: total.count };
  } catch (e) {
    console.error(`Error checking orphans for ${childTable}:`, (e as Error).message);
    return { orphans: 0, total: 0 };
  }
}

function checkEmptyContent(table: string, col: string) {
    try {
        const sql = `SELECT count(*) as count FROM ${table} WHERE ${col} IS NULL OR ${col} = '' OR ${col} = '[]'`;
        const result = db.prepare(sql).get() as { count: number };
        const total = db.prepare(`SELECT count(*) as count FROM ${table}`).get() as { count: number };
        console.log(`[Data Check] ${table}.${col} empty/null/[]: ${result.count} out of ${total.count} rows`);
    } catch (e) {
        console.error(`Error checking empty content for ${table}:`, (e as Error).message);
    }
}

try {
  // Check row counts
  console.log('--- Row Counts ---');
  const tables = ['agents', 'deals', 'transcripts', 'ai_analysis_logs'];
  for (const table of tables) {
    try {
      const count = db.prepare(`SELECT count(*) as count FROM ${table}`).get() as { count: number };
      console.log(`Table ${table}: ${count.count} rows`);
    } catch (e) {
      console.log(`Table ${table}: Error - ${(e as Error).message}`);
    }
  }

  console.log('\n--- Association Checks (Orphans) ---');
  // Check Agent associations
  checkOrphans('deals', 'agentId', 'agents');
  checkOrphans('transcripts', 'agentId', 'agents');
  checkOrphans('ai_analysis_logs', 'agentId', 'agents');
  
  // Check Deal associations
  checkOrphans('transcripts', 'dealId', 'deals');
  checkOrphans('ai_analysis_logs', 'dealId', 'deals');

  console.log('\n--- Data Content Checks ---');
  checkEmptyContent('transcripts', 'content');
  checkEmptyContent('ai_analysis_logs', 'signals');

} catch (err) {
  console.error('Error:', err);
}
