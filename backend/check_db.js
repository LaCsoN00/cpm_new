const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const evals = await prisma.evaluation.findMany({
    include: { project: true }
  })
  console.log(JSON.stringify(evals, null, 2))
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
