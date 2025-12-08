import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

console.log('--- Seeding Historical Trend Data ---');

// Get Agents and Tags
const agents = db.prepare('SELECT id FROM agents').all() as { id: string }[];
const tags = db.prepare('SELECT id, name FROM tags WHERE active = 1').all() as { id: string, name: string }[];

if (agents.length === 0 || tags.length === 0) {
    console.error('No agents or tags found. Please run the main app to seed basic data first.');
    process.exit(1);
}

console.log(`Found ${agents.length} agents and ${tags.length} tags.`);

const insertCall = db.prepare(`INSERT INTO calls (id, agentId, startedAt, duration, outcome, audioUrl) VALUES (@id, @agentId, @startedAt, @duration, @outcome, @audioUrl)`);
const insertAssessment = db.prepare(`INSERT INTO call_assessments (id, callId, tagId, score, reasoning) VALUES (@id, @callId, @tagId, @score, @reasoning)`);

let callIdCounter = Date.now();
let assessmentIdCounter = Date.now();

const generateHistory = db.transaction(() => {
    let totalCallsAdded = 0;

    agents.forEach((agent, index) => {
        // Base performance varies by agent
        let basePerformance = 0.9 - (index * 0.15);
        if (basePerformance < 0.4) basePerformance = 0.4;

        // Generate calls for the last 6 months (approx 180 days)
        // We want to simulate a trend where performance improves slightly over time
        for (let i = 0; i < 40; i++) { // ~40 calls per agent over 6 months
            const daysAgo = 7 + Math.floor(Math.random() * 173); // 7 to 180 days ago (avoid overlapping with recent 7 days too much)
            const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            
            // Trend: Older calls have slightly lower performance
            // 180 days ago -> factor = 0
            // 0 days ago -> factor = 0.1
            const trendFactor = (180 - daysAgo) / 180 * 0.1; 
            const currentPerformance = Math.min(0.95, basePerformance - 0.05 + trendFactor);

            const callId = `call_hist_${callIdCounter++}`;
            const isWin = Math.random() < currentPerformance;
            
            insertCall.run({
                id: callId,
                agentId: agent.id,
                startedAt: date.toISOString(),
                duration: 120 + Math.floor(Math.random() * 600),
                outcome: isWin ? 'won' : 'lost',
                audioUrl: `https://example.com/audio/${callId}.mp3`
            });

            // Assessments
            tags.forEach(tag => {
                let baseScore = currentPerformance * 100;
                let noise = (Math.random() - 0.5) * 30;
                let score = Math.max(0, Math.min(100, Math.floor(baseScore + noise)));

                insertAssessment.run({
                    id: `assess_hist_${assessmentIdCounter++}`,
                    callId: callId,
                    tagId: tag.id,
                    score: score,
                    reasoning: `Historical AI Reasoning for ${tag.name}`
                });
            });

            totalCallsAdded++;
        }
    });
    console.log(`Added ${totalCallsAdded} historical calls.`);
});

try {
    generateHistory();
    console.log('✅ Historical data seeded successfully!');
} catch (error) {
    console.error('❌ Error seeding data:', error);
}
