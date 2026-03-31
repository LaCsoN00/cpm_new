const http = require('http');

const data = JSON.stringify({
  name: "API Test Project",
  description: "Testing API",
  clientId: 1, // Assuming client 1 exists! Let's check if it exists. Actually we'll skip DB constraints if SQLite doesn't enforce strict FKs? Prisma does.
  status: "PLANNED"
});

// We need a user to create this, but we don't have auth token easily.
// Can we just use Prisma to create it exactly like the route does?
// YES.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const project = await prisma.project.create({
      data: {
        name: "Test API Project",
        clientId: 1,
        creatorId: 1, // Assuming user 1
        inviteCode: "API-" + Date.now()
      }
    });

    console.log("Created Project:", project);

    // Now auto-create eval exactly like the route
    const ev = await prisma.evaluation.create({
      data: {
        indicator: `Progression - ${project.name}`,
        targetValue: 100,
        actualValue: 0,
        projectId: project.id
      }
    });

    console.log("Created Eval:", ev);
  } catch (err) {
    console.error("FAILED!", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
