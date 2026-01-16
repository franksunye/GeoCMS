import { PrismaClient } from '../../src/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

// Initialize Prisma
const DATABASE_URL = process.env.DATABASE_URL || 'file:./team-calls.db'
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🧪 专项采样：正在为五步法寻找至少3个实证案例...\n')

    const allDeals = await prisma.deal.findMany({ select: { id: true, isOnsiteCompleted: true } })
    const onsiteMap = new Map(allDeals.map(d => [d.id, d.isOnsiteCompleted]))

    const allCallTags = await prisma.callTag.findMany({
        where: { score: { gte: 80 } },
        include: { tag: true, call: { include: { agent: true } } }
    })

    const getSamples = (tagId: string, count: number = 3) => {
        return allCallTags
            .filter(t => t.tagId === tagId && onsiteMap.get(t.callId) === 1)
            .slice(0, count)
    }

    const empathySamples = getSamples('empathy_shown', 4)
    const expertiseSamples = getSamples('expertise_display', 5)
    // expectation_setting usually covers Step 2, 3, 4.
    const expectationSamples = getSamples('expectation_setting', 6)
    const listeningSamples = getSamples('listening_good', 3)

    console.log('--- Step 1: Empathy ---')
    empathySamples.forEach(s => printSample(s))

    console.log('\n--- Step 2 & 4: Expertise/Value ---')
    expertiseSamples.forEach(s => printSample(s))

    console.log('\n--- Step 2, 3 & 4: Expectation ---')
    expectationSamples.forEach(s => printSample(s))

    console.log('\n--- Alternative: Listening ---')
    listeningSamples.forEach(s => printSample(s))
}

function printSample(s: any) {
    const mins = Math.floor(s.timestampSec / 60)
    const secs = Math.floor(s.timestampSec % 60)
    console.log(`[${s.call.agent?.name}] @ ${mins}:${secs.toString().padStart(2, '0')} (ID: ${s.callId}) [Tag: ${s.tagId}]`)
    console.log(`Score: ${s.score} | Text: "${s.contextText?.replace(/\r?\n/g, ' ')}"`)
    console.log(`Reasoning: ${s.reasoning}\n`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
