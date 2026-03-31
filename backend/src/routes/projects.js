const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { auth, managerOrAdminOnly } = require('../middleware/auth')
const { sendEmail } = require('../utils/mailer')
const { createNotification } = require('../utils/notification')
const prisma = new PrismaClient()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    let where = {}
    if (req.user.role !== 'ADMIN') {
      where = {
        OR: [
          { creatorId: req.user.id },
          { collaborators: { some: { id: req.user.id } } }
        ]
      }
    }
    const projects = await prisma.project.findMany({
      where,
      include: { milestones: true, client: true, collaborators: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(projects)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { milestones: true, evaluations: true, client: true, collaborators: true }
    })
    if (!project) return res.status(404).json({ message: 'Projet introuvable' })
    if (req.user.role !== 'ADMIN' && project.creatorId !== req.user.id && !project.collaborators.some(c => c.id === req.user.id)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    res.json(project)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Seuls les Managers peuvent créer des projets' })
  }
  try {
    const { name, description, startDate, endDate, status, responsible, clientId } = req.body
    if (!clientId) return res.status(400).json({ message: 'Le client est obligatoire' })
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const project = await prisma.project.create({
      data: {
        name, description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'PLANNED',
        responsible,
        clientId: parseInt(clientId),
        creatorId: req.user.id,
        inviteCode
      },
      include: { client: true, collaborators: true }
    })
    
    // Auto-create the default evaluation indicator for this project
    try {
      await prisma.evaluation.create({
        data: {
          indicator: `Progression - ${project.name}`,
          targetValue: 100,
          actualValue: 0,
          projectId: project.id
        }
      })
    } catch (evalErr) {
      console.error('Auto-evaluation creation failed:', evalErr)
    }
    
    req.io.emit('project_updated')
    
    // Trigger email notification if responsible is assigned (vía background promise)
    if (responsible) {
      prisma.user.findFirst({
        where: { OR: [{ name: responsible }, { email: responsible }] }
      }).then(async (collaborator) => {
        if (collaborator && collaborator.emailNotifications) {
          try {
            await sendEmail({
              to: collaborator.email,
              subject: 'Nouvelle assignation de projet',
              html: `<p>Bonjour ${collaborator.name},</p><p>Vous avez été assigné comme responsable du projet: <strong>${project.name}</strong>.</p><p>Connectez-vous à CPM pour intervenir.</p>`
            })
          } catch (eErr) {
            console.error('Email sending failed:', eErr)
          }
        }
      }).catch(cErr => console.error('Collaborator search for email failed:', cErr))
    }
    
    res.status(201).json(project)
  } catch (err) { 
    console.error('Project creation master error:', err)
    res.status(500).json({ message: 'Erreur serveur lors de la création du projet' }) 
  }
})

router.put('/:id', async (req, res) => {
  try {
    const projectCheck = await prisma.project.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!projectCheck) return res.status(404).json({ message: 'Projet introuvable' })
    if (projectCheck.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce projet' })
    }

    const { name, description, startDate, endDate, status, responsible, clientId } = req.body
    
    // Check if clientId is provided for update (optional if we don't allow changing client, but let's allow it)
    let dataToUpdate = { name, description, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null, status, responsible }
    if (clientId) dataToUpdate.clientId = parseInt(clientId)

    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: dataToUpdate
    })
    req.io.emit('project_updated')
    
    // Check if responsible has changed or notify regardless for updates
    if (responsible && responsible !== projectCheck.responsible) {
      const collaborator = await prisma.user.findFirst({
        where: { OR: [{ name: responsible }, { email: responsible }] }
      })
      if (collaborator && collaborator.emailNotifications) {
        await sendEmail({
          to: collaborator.email,
          subject: "Mise à jour d'assignation de projet",
          html: `<p>Bonjour ${collaborator.name},</p><p>Vous êtes maintenant responsable du projet: <strong>${project.name}</strong>.</p><p>Connectez-vous à CPM pour intervenir.</p>`
        })
      }
    }
    
    res.json(project)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const projectCheck = await prisma.project.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!projectCheck) return res.status(404).json({ message: 'Projet introuvable' })
    if (projectCheck.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce projet' })
    }

    await prisma.project.delete({ where: { id: parseInt(req.params.id) } })
    req.io.emit('project_updated')
    res.json({ message: 'Projet supprimé' })
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) return res.status(400).json({ message: "Code d'invitation requis" })

    const project = await prisma.project.findUnique({ where: { inviteCode } })
    if (!project) return res.status(404).json({ message: 'Code invalide ou projet introuvable' })

    const alreadyJoined = await prisma.project.findFirst({
      where: {
        id: project.id,
        collaborators: { some: { id: req.user.id } }
      }
    })
    if (alreadyJoined) return res.status(400).json({ message: 'Vous êtes déjà dans ce projet' })

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: { collaborators: { connect: { id: req.user.id } } },
      include: { client: true, milestones: true, collaborators: true }
    })
    
    // Notify project creator
    await createNotification(
      req.io,
      project.creatorId,
      'Nouveau collaborateur',
      `${req.user.name} a rejoint le projet ${project.name} via le code d'invitation.`,
      'SUCCESS'
    )

    req.io.emit('project_updated')
    res.json(updatedProject)
  } catch (err) { 
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' }) 
  }
})

module.exports = router
