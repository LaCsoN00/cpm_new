const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { auth, managerOnly } = require('../middleware/auth')
const prisma = new PrismaClient()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    let where = {}
    if (req.user.role === 'COLLABORATOR') {
      where = { 
        project: { 
          OR: [
            { creatorId: req.user.id },
            { collaborators: { some: { id: req.user.id } } }
          ]
        }
      }
    }
    const evals = await prisma.evaluation.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(evals)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/', managerOnly, async (req, res) => {
  try {
    const { indicator, targetValue, actualValue, projectId } = req.body
    const ev = await prisma.evaluation.create({
      data: { indicator, targetValue: parseFloat(targetValue) || 0, actualValue: parseFloat(actualValue) || 0, projectId: projectId ? parseInt(projectId) : null }
    })
    req.io.emit('evaluation_updated')
    res.status(201).json(ev)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.put('/:id', managerOnly, async (req, res) => {
  try {
    const { indicator, targetValue, actualValue, projectId } = req.body
    const ev = await prisma.evaluation.update({
      where: { id: parseInt(req.params.id) },
      data: { indicator, targetValue: parseFloat(targetValue), actualValue: parseFloat(actualValue), projectId: projectId ? parseInt(projectId) : null }
    })
    req.io.emit('evaluation_updated')
    res.json(ev)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.delete('/:id', managerOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const ev = await prisma.evaluation.findUnique({
      where: { id },
      include: { project: { include: { milestones: true } } }
    })

    if (!ev) return res.status(404).json({ message: 'Indicateur non trouvé' })

    if (ev.project) {
      const ms = ev.project.milestones || []
      const progress = ms.length > 0 
        ? Math.round(ms.reduce((acc, m) => acc + (m.progress || 0), 0) / ms.length) 
        : 0
      
      if (progress < 100) {
        return res.status(400).json({ message: 'Impossible de supprimer un indicateur avant la fin du projet (100% de progression).' })
      }
    }

    await prisma.evaluation.delete({ where: { id } })
    req.io.emit('evaluation_updated')
    res.json({ message: 'Supprimé' })
  } catch (err) { 
    console.error('Delete evaluation error:', err)
    res.status(500).json({ message: 'Erreur serveur' }) 
  }
})

module.exports = router
