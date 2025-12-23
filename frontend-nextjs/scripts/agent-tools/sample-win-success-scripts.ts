import { PrismaClient } from '../../src/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || 'file:./team-calls.db'
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🧪 专项采样：为成交转化五步法寻找实证案例...\n')

    const deals = await prisma.deal.findMany({ select: { id: true, outcome: true } })
    const outcomeMap = new Map(deals.map(d => [d.id, d.outcome]))

    const allCallTags = await prisma.callTag.findMany({
        where: { score: { gte: 70 } },
        include: { tag: true, call: { include: { agent: true } } }
    })

    const getWonSamples = (tagId: string, count: number = 3) => {
        return allCallTags
            .filter(t => t.tagId === tagId && outcomeMap.get(t.callId) === 'won')
            .slice(0, count)
    }

    // 1. 速度与主动性
    const speedSamples = getWonSamples('same_day_visit_attempt', 3)
    // 2. 微信/交接指令
    const handoverSamples = getWonSamples('handover_process_explained', 3)
    // 3. 异议处理
    const objectionSamples = getWonSamples('customer_objection_scope', 3)
    if (objectionSamples.length < 3) objectionSamples.push(...getWonSamples('handover_process_explained', 3 - objectionSamples.length))
    // 4. 倾听回应
    const listeningSamples = getWonSamples('listening_good', 3)
    // 5. 简单专业
    const professionalSamples = getWonSamples('expertise_display', 3)

    const printS = (title: string, samples: any[]) => {
        console.log(`\n--- ${title} ---`)
        samples.forEach(s => {
            const mins = Math.floor(s.timestampSec / 60)
            const secs = Math.floor(s.timestampSec % 60)
            console.log(`[${s.call.agent?.name}] @ ${mins}:${secs.toString().padStart(2, '0')} (ID: ${s.callId})`)
            console.log(`Text: "${s.contextText?.replace(/\r?\n/g, ' ')}"`)
        })
    }

    printS("Speed", speedSamples)
    printS("Handover", handoverSamples)
    printS("Objection", objectionSamples)
    printS("Listening", listeningSamples)
    printS("Professional", professionalSamples)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
