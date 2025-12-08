
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

// Fetch all available tags to use in mock data
const tags = db.prepare('SELECT id, name FROM tags').all() as { id: string, name: string }[];

if (tags.length === 0) {
  console.error('No tags found in database. Cannot generate mock signals.');
  process.exit(1);
}

console.log(`Found ${tags.length} tags. Starting mock data generation...`);

const logs = db.prepare('SELECT id FROM ai_analysis_logs').all() as { id: string }[];

let updatedCount = 0;

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const updateStmt = db.prepare('UPDATE ai_analysis_logs SET signals = ? WHERE id = ?');

db.transaction(() => {
  for (const log of logs) {
    // Generate 3 to 6 random signals per log
    const numSignals = getRandomInt(3, 6);
    const signals = [];
    
    // Shuffle tags to pick random unique ones
    const shuffledTags = [...tags].sort(() => 0.5 - Math.random());
    const selectedTags = shuffledTags.slice(0, numSignals);

    for (const tag of selectedTags) {
      signals.push({
        tagId: tag.id,
        tagName: tag.name, // Helpful for debugging, though ID is the link
        score: getRandomInt(60, 100), // Skew towards positive/realistic scores
        confidence: parseFloat(getRandomFloat(0.7, 0.99).toFixed(2)),
        context: `Mock context for ${tag.name}: The agent demonstrated this skill effectively during the conversation.`,
        timestamp: getRandomInt(10, 300) // Random timestamp in seconds
      });
    }

    const signalsJson = JSON.stringify(signals);
    updateStmt.run(signalsJson, log.id);
    updatedCount++;
  }
})();

console.log(`Successfully updated ${updatedCount} records in ai_analysis_logs with mock JSON signals.`);
