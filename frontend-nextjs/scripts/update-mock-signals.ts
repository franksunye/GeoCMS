
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

// Fetch all available tags
const tags = db.prepare('SELECT * FROM tags').all() as any[];

if (tags.length === 0) {
  console.error('No tags found in database.');
  process.exit(1);
}

// Map severity
const mapSeverity = (sev: string) => {
    if (sev === '无') return 'none';
    return sev || 'none';
};

// Fetch logs
const logs = db.prepare('SELECT id FROM ai_analysis_logs').all() as { id: string }[];
console.log(`Found ${logs.length} logs to update.`);

const updateStmt = db.prepare('UPDATE ai_analysis_logs SET signals = ? WHERE id = ?');

let updatedCount = 0;

db.transaction(() => {
    for (const log of logs) {
        // Generate 1-3 signals
        const numSignals = Math.floor(Math.random() * 3) + 1;
        const signals = [];
        
        const shuffledTags = [...tags].sort(() => 0.5 - Math.random());
        const selectedTags = shuffledTags.slice(0, numSignals);
        
        for (const tag of selectedTags) {
            // Generate Score 1-5
            const score = parseFloat((Math.random() * 4 + 1).toFixed(2));
            
            // Generate Timestamp
            // 0-30 minutes
            const min = Math.floor(Math.random() * 30);
            const sec = Math.floor(Math.random() * 60);
            // Format 00:00:00 or 00:00? User example "00:01:34" is HH:MM:SS or MM:SS?
            // Usually 00:01:34 looks like HH:MM:SS if hour is 00. Or it could be MM:SS:MS?
            // Context says "00:01:34". I will assume HH:MM:SS format to be safe, so "00:" + MM + ":" + SS.
            const timestamp = `00:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
            
            signals.push({
                tag: tag.code,
                category: tag.category,
                dimension: tag.dimension,
                polarity: tag.polarity || 'neutral',
                severity: mapSeverity(tag.severity),
                score: score,
                confidence: parseFloat(Math.random().toFixed(2)),
                context: `Mock context for ${tag.name}: 客户提到了相关内容...`,
                timestamp: timestamp,
                reasoning: `Mock reasoning: AI Detected ${tag.name} (${tag.category}) with score ${score}.`
            });
        }
        
        updateStmt.run(JSON.stringify(signals), log.id);
        updatedCount++;
    }
})();

console.log(`Updated ${updatedCount} logs.`);
