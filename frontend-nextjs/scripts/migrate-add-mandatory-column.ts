
import db from '../src/lib/db';

function migrate() {
    console.log('--- Migrating tags table: Adding is_mandatory column ---');

    try {
        // 1. Add Column
        db.prepare('ALTER TABLE tags ADD COLUMN is_mandatory BOOLEAN DEFAULT 0').run();
        console.log('✅ Column is_mandatory added.');
    } catch (e: any) {
        if (e.message.includes('duplicate column name')) {
            console.log('ℹ️ Column is_mandatory already exists.');
        } else {
            console.error('❌ Failed to add column:', e);
            // Don't exit process, continue to update data
        }
    }

    // 2. Set Mandatory Defaults for Key Process Tags
    const mandatoryCodes = [
        'opening_complete',
        'needs_identification',
        'schedule_attempt',
        'handover_process_explained'
    ];

    const updateStmt = db.prepare('UPDATE tags SET is_mandatory = 1 WHERE code = ?');

    let updatedCount = 0;
    db.transaction(() => {
        for (const code of mandatoryCodes) {
            const info = updateStmt.run(code);
            if (info.changes > 0) {
                console.log(`✅ Set Mandatory: ${code}`);
                updatedCount++;
            }
        }
    })();

    console.log(`Migration complete. Updated ${updatedCount} tags to mandatory.`);
}

migrate();
