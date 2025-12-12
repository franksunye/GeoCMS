import prisma from '../src/lib/prisma'

async function main() {
    const tags = await prisma.tag.findMany({
        where: {
            name: {
                contains: '解决方案请求'
            }
        }
    })

    console.log('Tags found:', JSON.stringify(tags, null, 2))
}

main()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1) })
