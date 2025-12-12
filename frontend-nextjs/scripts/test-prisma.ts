/**
 * Prisma 集成测试脚本
 * 
 * 验证 Prisma Client 是否能正确连接并查询数据库
 * 
 * 运行: npx tsx scripts/test-prisma.ts
 */

import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('🔍 Testing Prisma Connection...\n')

    try {
        // 1. 测试 Tags 查询
        const tags = await prisma.tag.findMany({
            take: 5,
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
                dimension: true,
            }
        })
        console.log(`✅ Tags: Found ${tags.length} records`)
        console.table(tags)

        // 2. 测试 Signals 查询
        const signals = await prisma.signal.findMany({
            take: 5,
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
            }
        })
        console.log(`\n✅ Signals: Found ${signals.length} records`)
        console.table(signals)

        // 3. 测试 Calls 查询（包含关联）
        const calls = await prisma.call.findMany({
            take: 3,
            include: {
                agent: {
                    select: {
                        name: true,
                    }
                },
                _count: {
                    select: {
                        assessments: true,
                        signals: true,
                    }
                }
            },
            orderBy: {
                startedAt: 'desc'
            }
        })
        console.log(`\n✅ Calls: Found ${calls.length} records with relations`)
        calls.forEach(call => {
            console.log(`  - Call ${call.id}: Agent=${call.agent.name}, Assessments=${call._count.assessments}, Signals=${call._count.signals}`)
        })

        // 4. 测试聚合查询
        const callStats = await prisma.call.aggregate({
            _count: true,
            _avg: {
                duration: true
            }
        })
        console.log(`\n✅ Call Stats: Total=${callStats._count}, Avg Duration=${callStats._avg.duration?.toFixed(0)}s`)

        // 5. 测试 Prompts
        const prompts = await prisma.prompt.findMany({
            select: {
                id: true,
                name: true,
                isDefault: true,
                active: true,
            }
        })
        console.log(`\n✅ Prompts: Found ${prompts.length} records`)
        console.table(prompts)

        console.log('\n🎉 All Prisma tests passed!')

    } catch (error) {
        console.error('❌ Prisma test failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
