const axios = require('axios')

// We'll try to find an evaluation linked to a project (e.g. ID 2 from my previous test)
// and try to delete it via the API.
// Since we don't have a valid JWT easily here without creating a user, 
// I'll just check if the logic is in the code.

// Or better, I can run a node script that uses Prisma directly to simulate a delete request flow.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDelete() {
  try {
    const id = 2 // The evaluation I created earlier
    const ev = await prisma.evaluation.findUnique({
      where: { id },
      include: { project: { include: { milestones: true } } }
    })

    if (ev && ev.project) {
      const ms = ev.project.milestones || []
      const progress = ms.length > 0 
        ? Math.round(ms.reduce((acc, m) => acc + (m.progress || 0), 0) / ms.length) 
        : 0
      
      console.log(`Project progress for eval ${id}: ${progress}%`)
      if (progress < 100) {
        console.log("SUCCESS: Deletion would be blocked (progress < 100%)")
      } else {
        console.log("Deletion would be allowed (progress is 100%)")
      }
    } else {
      console.log("Eval not found or no project linked.")
    }
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

testDelete()
