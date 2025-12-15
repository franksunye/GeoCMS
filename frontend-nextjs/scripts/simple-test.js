
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const prisma = new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }))
});

async function testApi() {
    console.log('Testing API queries...');
    
    try {
        // 1. Calls
        console.log('1. Calls...');
        const calls = await prisma.call.findMany({
            take: 5,
            include: { agent: true }
        });
        console.log('Calls:', calls.length);
        if (calls.length > 0) console.log('Sample Call:', calls[0]);

        // 2. Transcripts
        console.log('\n2. Transcripts...');
        const transcripts = await prisma.transcript.findMany({ take: 5 });
        console.log('Transcripts:', transcripts.length);
        if (transcripts.length > 0) console.log('Sample Transcript:', transcripts[0]);

        // 3. Signals
        console.log('\n3. Signals...');
        const signals = await prisma.callSignal.findMany({ take: 5 });
        console.log('Signals:', signals.length);
        
        // 4. Assessments & Tags
        console.log('\n4. Assessments...');
        const assessments = await prisma.callAssessment.findMany({ 
            take: 5,
            include: { tag: true }
        });
        console.log('Assessments:', assessments.length);
        if (assessments.length > 0) console.log('Sample Assessment tag:', assessments[0].tag);

        console.log('\n✅ Data looks accessible');
        
    } catch(e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testApi();
