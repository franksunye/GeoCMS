import prisma from '../src/lib/prisma'

async function main() {
    const textFragment = "哎，您好呢，是这样子的啊，我想请问一下"

    const assessment = await prisma.callAssessment.findFirst({
        where: {
            contextText: {
                contains: textFragment
            }
        },
        include: {
            tag: true
        }
    })

    if (assessment) {
        console.log('Found Assessment:')
        console.log(`  ID: ${assessment.id}`)
        console.log(`  Tag Code: ${assessment.tag.code}`)
        console.log(`  Tag Name: ${assessment.tag.name}`)
        console.log(`  Tag Dimension: ${assessment.tag.dimension}`)
        console.log(`  Tag Category: ${assessment.tag.category}`)
    } else {
        console.log('Assessment not found')
    }
}

main()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1) })
