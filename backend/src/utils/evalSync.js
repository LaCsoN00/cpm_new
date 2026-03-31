const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Recalculates project progress based on milestones and updates all linked evaluations.
 * @param {number} projectId 
 */
async function updateProjectEvaluations(projectId) {
  try {
    if (!projectId) return

    // 1. Get all milestones for this project
    const milestones = await prisma.milestone.findMany({
      where: { projectId: parseInt(projectId) }
    })

    // 2. Calculate average progress
    let progress = 0
    if (milestones.length > 0) {
      const sum = milestones.reduce((acc, m) => acc + (m.progress || 0), 0)
      progress = Math.round(sum / milestones.length)
    }

    // 3. Update all evaluations linked to this project
    // We set actualValue to the calculated progress
    await prisma.evaluation.updateMany({
      where: { projectId: parseInt(projectId) },
      data: { actualValue: progress }
    })

    console.log(`[EvalSync] Updated evaluations for project ${projectId} with progress ${progress}%`)
  } catch (error) {
    console.error(`[EvalSync] Error updating evaluations for project ${projectId}:`, error)
  }
}

module.exports = { updateProjectEvaluations }
