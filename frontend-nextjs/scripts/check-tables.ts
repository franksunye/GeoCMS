
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

const tables = ['calls', 'call_assessments'];

for (const table of tables) {
  console.log(`\n--- Schema for ${table} ---`);
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    console.table(info);
  } catch (e) {
    console.log(`Table ${table} does not exist.`);
  }
}
