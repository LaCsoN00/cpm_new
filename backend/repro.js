const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    console.log("Creating project...")
    const project = await prisma.project.create({
      data: {
        name: "Test Project Debug",
        description: "Testing auto evaluation",
        clientId: 1, // Assuming client 1 exists
        creatorId: 1, // Assuming user 1 exists
        inviteCode: "DEBUG-" + Date.now()
      }
    })
    console.log("Project created:", project.id)

    console.log("Creating evaluation...")
    const evaluation = await prisma.evaluation.create({
      data: {
        indicator: `Progression - ${project.name}`,
        targetValue: 100,
        actualValue: 0,
        projectId: project.id
      }
    })
    console.log("Evaluation created:", evaluation.id)

  } catch (err) {
    console.error("ERROR:", err)
  } finally {
    await prisma.$disconnect()
  }
}

test()
