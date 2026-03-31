const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 La base de données a été réinitialisée. Aucune donnée fictive n\'a été insérée.')
  console.log('👉 Veuillez utiliser la page d\'inscription pour créer votre premier compte.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
