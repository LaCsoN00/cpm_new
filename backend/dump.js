const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Projects:");
  const p = await prisma.project.findMany();
  console.log(JSON.stringify(p, null, 2));

  console.log("Evaluations:");
  const e = await prisma.evaluation.findMany();
  console.log(JSON.stringify(e, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
