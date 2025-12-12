import prisma from '../src/lib/prisma'

async function main() {
    // Find call by transcript content
    const transcript = await prisma.transcript.findFirst({
        where: {
            content: {
                contains: '姜东博'
            }
        }
    })

    if (!transcript) {
        console.log('Call not found by transcript')
        return
    }

    const callId = transcript.dealId // typically dealId = callId in this system
    console.log(`Found Call ID: ${callId}`)

    const assessments = await prisma.callAssessment.findMany({
        where: {
            callId: callId
        },
        include: {
            tag: true
        }
    })

    const target = assessments.find(a => a.tag.name === '解决方案请求')

    if (target) {
        console.log('Target Tag ID:', target.tag.id)
        console.log('Target Tag Code:', target.tag.code)
        console.log('Target Tag Name:', target.tag.name)
        console.log('Target Tag Dimension:', target.tag.dimension)
        console.log('Target Tag Category:', target.tag.category)
    } else {
        console.log('Target Tag "解决方案请求" not found in this call.')
        console.log('Available tags:', assessments.map(a => a.tag.name).join(', '))
    }

    // Also check Tag table directly by code
    if (target) {
        const tagDirect = await prisma.tag.findUnique({ where: { code: target.tag.code } })
        console.log('Direct Tag Lookup:', tagDirect)
    }
}

main()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1) })
