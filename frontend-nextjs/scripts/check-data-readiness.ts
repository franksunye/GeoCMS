import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

console.log('--- Checking Scorecard Data Readiness ---');

function checkCount(label: string, query: string) {
    try {
        const result = db.prepare(query).get() as { count: number };
        console.log(`${label}: ${result.count}`);
        return result.count;
    } catch (e) {
        console.error(`Error checking ${label}:`, e);
        return 0;
    }
}

// 1. Basic Table Counts
const agentCount = checkCount('Total Agents', 'SELECT count(*) as count FROM agents');
const callCount = checkCount('Total Calls', 'SELECT count(*) as count FROM calls');
const assessmentCount = checkCount('Total Assessments', 'SELECT count(*) as count FROM call_assessments');
const tagCount = checkCount('Active Tags', 'SELECT count(*) as count FROM tags WHERE active = 1');

// 2. Data Integrity Checks
console.log('\n--- Data Integrity ---');

// Check calls without agents
const orphanCalls = checkCount('Calls without valid Agent', `
    SELECT count(*) as count 
    FROM calls c 
    LEFT JOIN agents a ON c.agentId = a.id 
    WHERE a.id IS NULL
`);

// Check assessments without valid calls
const orphanAssessments = checkCount('Assessments without valid Call', `
    SELECT count(*) as count 
    FROM call_assessments ca 
    LEFT JOIN calls c ON ca.callId = c.id 
    WHERE c.id IS NULL
`);

// Check assessments without valid tags
const invalidTagAssessments = checkCount('Assessments without valid Tag', `
    SELECT count(*) as count 
    FROM call_assessments ca 
    LEFT JOIN tags t ON ca.tagId = t.id 
    WHERE t.id IS NULL
`);

// 3. Scorecard specific requirements
console.log('\n--- Scorecard Requirements ---');

// Check if we have scores
const scoredAssessments = checkCount('Assessments with Score > 0', 'SELECT count(*) as count FROM call_assessments WHERE score > 0');

// Check date range coverage
try {
    const range = db.prepare('SELECT min(startedAt) as minDate, max(startedAt) as maxDate FROM calls').get() as { minDate: string, maxDate: string };
    console.log(`Date Range: ${range.minDate} to ${range.maxDate}`);
} catch (e) {
    console.log('Date Range: Could not determine');
}

console.log('\n--- Summary ---');
if (agentCount > 0 && callCount > 0 && assessmentCount > 0 && tagCount > 0) {
    if (orphanCalls === 0 && orphanAssessments === 0 && invalidTagAssessments === 0) {
         console.log('✅ Data is READY for Scorecard module.');
    } else {
         console.log('⚠️ Data exists but has integrity issues (orphans).');
    }
} else {
    console.log('❌ Data is MISSING. Please run ETL process.');
}
