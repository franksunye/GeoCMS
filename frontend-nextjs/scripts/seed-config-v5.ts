
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { SIGNALS, TAGS } from '../src/lib/data/signal-spec-v5';

const dbPath = path.join(process.cwd(), 'team-calls.db');
const db = new Database(dbPath);

function seedConfig() {
  console.log('Seeding configuration from V5 Spec...');

  // 1. Seed Tags
  const insertTag = db.prepare(`
    INSERT INTO tags (id, code, name, category, dimension, type, scoreRange, description, createdAt, updatedAt)
    VALUES (@id, @code, @name, @category, @dimension, @type, @scoreRange, @description, datetime('now'), datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      dimension = excluded.dimension,
      type = excluded.type,
      scoreRange = excluded.scoreRange,
      description = excluded.description,
      updatedAt = datetime('now')
  `);

  console.log(`Processing ${TAGS.length} tags...`);
  db.transaction(() => {
    for (const tag of TAGS) {
      // Check if tag exists to preserve ID
      const existing = db.prepare('SELECT id FROM tags WHERE code = ?').get(tag.code) as { id: string } | undefined;
      const id = existing ? existing.id : randomUUID();

      // Infer type/polarity from category/dimension
      let type = 'Neutral';
      if (tag.category === 'Service Issue' || tag.dimension === 'Constraint') {
        type = 'Negative';
      } else if (tag.dimension === 'Skills' || tag.dimension === 'Communication' || tag.dimension === 'Intent') {
        type = 'Positive';
      } else if (tag.dimension === 'Process') {
        type = 'Process';
      }

      insertTag.run({
        id,
        code: tag.code,
        name: tag.name,
        category: tag.category,
        dimension: tag.dimension,
        type: type, // Use inferred type
        scoreRange: tag.scoreLogic,
        description: tag.description
      });
    }
  })();

  // 2. Seed Signals
  const insertSignal = db.prepare(`
    INSERT INTO signals (id, code, name, category, dimension, targetTagCode, aggregationMethod, description, createdAt, updatedAt)
    VALUES (@id, @code, @name, @category, @dimension, @targetTagCode, @aggregationMethod, @description, datetime('now'), datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      dimension = excluded.dimension,
      targetTagCode = excluded.targetTagCode,
      aggregationMethod = excluded.aggregationMethod,
      description = excluded.description,
      updatedAt = datetime('now')
  `);

  console.log(`Processing ${SIGNALS.length} signals...`);
  db.transaction(() => {
    for (const signal of SIGNALS) {
      const existing = db.prepare('SELECT id FROM signals WHERE code = ?').get(signal.code) as { id: string } | undefined;
      const id = existing ? existing.id : randomUUID();

      insertSignal.run({
        id,
        code: signal.code,
        name: signal.name,
        category: signal.category,
        dimension: signal.dimension,
        targetTagCode: signal.targetTagCode,
        aggregationMethod: signal.aggregation,
        description: signal.scoreLogic // Using score logic as description for now
      });
    }
  })();

  console.log('Configuration seeded successfully.');
}

seedConfig();
