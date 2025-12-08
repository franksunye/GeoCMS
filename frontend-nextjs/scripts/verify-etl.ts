
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

console.log('--- Calls Sample ---');
const calls = db.prepare('SELECT * FROM calls LIMIT 3').all();
console.log(calls);

console.log('\n--- Call Assessments Sample ---');
const assessments = db.prepare('SELECT * FROM call_assessments LIMIT 3').all();
console.log(assessments);
