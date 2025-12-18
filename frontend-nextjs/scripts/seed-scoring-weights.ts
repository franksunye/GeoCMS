
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const HIGH_VALUE_TAGS = ['价格异议', '时间异议', '专业方案提议', '时间安排请求', '高意向', '异议已处理']
const LOW_VALUE_TAGS = ['客户是业主/决策者', '尝试当天上门', '解释交接流程', '开场完成', '专业语气']

async function main() {
    console.log('Fetching tags...')

    // 1. Get Tags
    const highTags = await prisma.tag.findMany({
        where: { name: { in: HIGH_VALUE_TAGS } }
    })

    const lowTags = await prisma.tag.findMany({
        where: { name: { in: LOW_VALUE_TAGS } }
    })

    console.log(`Found ${highTags.length} high value tags and ${lowTags.length} low value tags.`)

    // 2. Clear existing TagBased rules to be clean
    await prisma.scoringRule.deleteMany({
        where: { ruleType: 'TagBased' }
    })
    console.log('Cleared existing rules.')

    const now = new Date().toISOString()

    // 3. Create High Value Rules (Weight 2.5)
    for (const tag of highTags) {
        await prisma.scoringRule.create({
            data: {
                id: `rule_high_${tag.code}`,
                name: `High Value: ${tag.name}`,
                appliesTo: 'Calls',
                description: 'Critical skill for closing',
                active: 1,
                ruleType: 'TagBased',
                tagCode: tag.code,
                targetDimension: tag.dimension,
                scoreAdjustment: 0,
                weight: 2.5,
                createdAt: now,
                updatedAt: now
            }
        })
        console.log(`Created rule for ${tag.name} (x2.5)`)
    }

    // 4. Create Low Value Rules (Weight 0.3)
    for (const tag of lowTags) {
        await prisma.scoringRule.create({
            data: {
                id: `rule_low_${tag.code}`,
                name: `Low Value: ${tag.name}`,
                appliesTo: 'Calls',
                description: 'Routine process step',
                active: 1,
                ruleType: 'TagBased',
                tagCode: tag.code,
                targetDimension: tag.dimension,
                scoreAdjustment: 0,
                weight: 0.3,
                createdAt: now,
                updatedAt: now
            }
        })
        console.log(`Created rule for ${tag.name} (x0.3)`)
    }

    console.log('Done!')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
