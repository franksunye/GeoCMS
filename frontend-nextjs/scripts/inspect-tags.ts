
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

const schema = db.prepare("PRAGMA table_info(tags)").all();
console.log(schema);

const distinctSeverity = db.prepare("SELECT DISTINCT severity FROM tags").all();
console.log('Distinct Severity:', distinctSeverity);

const distinctType = db.prepare("SELECT DISTINCT type FROM tags").all();
console.log('Distinct Type:', distinctType);
