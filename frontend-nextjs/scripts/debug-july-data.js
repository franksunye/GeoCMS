const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const JulyStart = new Date('2025-07-01T00:00:00Z')
  const JulyEnd = new Date('2025-07-31T23:59:59Z')

  const callCount = await prisma.call.count({
    where: {
      startedAt: {
        gte: JulyStart,
        lte: JulyEnd
      }
    }
  })

  const agentCount = await prisma.agent.count()
  
  console.log({
    julyCallCount: callCount,
    totalAgentCount: agentCount,
    range: { start: JulyStart.toISOString(), end: JulyEnd.toISOString() }
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
