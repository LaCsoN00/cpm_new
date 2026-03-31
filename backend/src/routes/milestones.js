const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { auth, managerOnly } = require('../middleware/auth')
const { updateProjectEvaluations } = require('../utils/evalSync')
const { createNotification } = require('../utils/notification')
const prisma = new PrismaClient()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    let where = req.query.projectId ? { projectId: parseInt(req.query.projectId) } : {}
    if (req.user.role === 'COLLABORATOR') {
      where = { 
        ...where,
        project: { 
          OR: [
            { creatorId: req.user.id },
            { collaborators: { some: { id: req.user.id } } }
          ]
        }
      }
    }
    const milestones = await prisma.milestone.findMany({ where, include: { project: { select: { name: true } } }, orderBy: { targetDate: 'asc' } })
    res.json(milestones)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/', managerOnly, async (req, res) => {
  try {
    const { name, targetDate, status, progress, projectId } = req.body
    const ms = await prisma.milestone.create({
      data: { name, targetDate: targetDate ? new Date(targetDate) : null, status: status || 'PENDING', progress: parseInt(progress) || 0, projectId: parseInt(projectId) }
    })
    
    // Sync evaluations
    await updateProjectEvaluations(ms.projectId)
    
    req.io.emit('milestone_updated', { projectId: ms.projectId })
    res.status(201).json(ms)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.put('/:id', managerOnly, async (req, res) => {
  try {
    const { name, targetDate, status, progress } = req.body
    const ms = await prisma.milestone.update({
      where: { id: parseInt(req.params.id) },
      data: { name, targetDate: targetDate ? new Date(targetDate) : null, status, progress: parseInt(progress) || 0 },
      include: { project: { include: { collaborators: true } } }
    })
    
    // Notify collaborators if milestone achieved
    if (status === 'ACHIEVED' && ms.project && ms.project.collaborators) {
      for (const collab of ms.project.collaborators) {
        if (collab.id !== req.user.id) {
          await createNotification(
            req.io,
            collab.id,
            'Jalon terminé',
            `Le jalon "${ms.name}" du projet "${ms.project.name}" a été marqué comme terminé.`,
            'SUCCESS'
          )
        }
      }
    }

    // Sync evaluations
    await updateProjectEvaluations(ms.projectId)
    
    req.io.emit('milestone_updated', { projectId: ms.projectId })
    res.json(ms)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.delete('/:id', managerOnly, async (req, res) => {
  try {
    const ms = await prisma.milestone.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!ms) return res.status(404).json({ message: 'Jalon introuvable' })
    
    await prisma.milestone.delete({ where: { id: parseInt(req.params.id) } })
    
    // Sync evaluations
    await updateProjectEvaluations(ms.projectId)
    
    req.io.emit('milestone_updated', { projectId: ms.projectId })
    res.json({ message: 'Jalon supprimé' })
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

module.exports = router
