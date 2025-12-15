
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 模拟 src/lib/prisma.ts 的初始化逻辑
const prismaClientSingleton = () => {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');

    if (isPostgres) {
        console.log('Using PostgreSQL adapter');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    } else {
        console.log('Using SQLite (should not happen for Supabase test)');
        return new PrismaClient();
    }
}

const prisma = prismaClientSingleton();

async function testApiLogic() {
    console.log('🚀 开始测试 API 逻辑...');

    try {
        // 1. Fetch Calls
        console.log('1. Fetching Calls...');
        const calls = await prisma.call.findMany({
            include: {
                agent: { select: { name: true, avatarId: true } }
            },
            orderBy: { startedAt: 'desc' }
        });
        console.log(`   ✅ Calls fetched: ${calls.length}`);

        // 2. Transcripts
        console.log('2. Fetching Transcripts...');
        const transcripts = await prisma.transcript.findMany({
            select: { dealId: true, content: true }
        });
        console.log(`   ✅ Transcripts fetched: ${transcripts.length}`);

        // 3. Signals
        console.log('3. Fetching Signals...');
        const allSignals = await prisma.callSignal.findMany({
            orderBy: { timestampSec: 'asc' }
        });
        console.log(`   ✅ Signals fetched: ${allSignals.length}`);

        // 4. Checking mapping
        const transcriptMap = new Map(transcripts.map(t => [t.dealId, t.content]));
        let missingTranscripts = 0;

        calls.forEach(call => {
            const t = transcriptMap.get(call.id);
            if (!t) missingTranscripts++;
        });
        console.log(`   ℹ️ Calls missing transcripts: ${missingTranscripts}/${calls.length} (Expected for partial migration)`);

        console.log('✨ 逻辑测试通过！API 应该能正常返回数据。');

    } catch (e) {
        console.error('❌ API 逻辑报错:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testApiLogic();
