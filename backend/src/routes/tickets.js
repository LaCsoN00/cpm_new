const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { auth, managerOrAdminOnly } = require('../middleware/auth')
const { createNotification } = require('../utils/notification')
const prisma = new PrismaClient()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const where = req.user.role === 'COLLABORATOR' ? { creatorId: req.user.id } : {}
    const tickets = await prisma.ticket.findMany({ 
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    res.json(tickets)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'COLLABORATOR') return res.status(403).json({ message: 'Seuls les collaborateurs peuvent créer des tickets' })
  try {
    const { title, description, priority, status } = req.body
    const ticket = await prisma.ticket.create({
      data: { 
        title, 
        description, 
        priority: priority || 'MEDIUM', 
        status: status || 'OPEN',
        creatorId: req.user.id
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        comments: true
      }
    })

    // Notify Managers of the new ticket
    const managers = await prisma.user.findMany({ where: { role: 'MANAGER' } })
    for (const manager of managers) {
      await createNotification(
        req.io,
        manager.id,
        'Nouveau ticket',
        `${req.user.name} a ouvert un nouveau ticket: ${ticket.title}`,
        'INFO'
      )
    }

    req.io.emit('ticket_updated')
    res.status(201).json(ticket)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.put('/:id', auth, async (req, res) => {
  if (req.user.role === 'ADMIN') return res.status(403).json({ message: 'L\'administrateur ne peut pas modifier de tickets' })
  // Option: seul le créateur ou un Manager peut modifier
  // Actuellement managerOrAdminOnly était utilisé. Je vais utiliser managerOnly ou créateur.
  if (req.user.role !== 'MANAGER') {
     const ticketCheck = await prisma.ticket.findUnique({ where: { id: parseInt(req.params.id) } })
     if (ticketCheck.creatorId !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })
  }
  try {
    const { title, description, priority, status } = req.body
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description, priority, status },
      include: { creator: true }
    })

    // Notify creator if status changed and it wasn't the creator who changed it
    if (status && ticket.creatorId !== req.user.id) {
      await createNotification(
        req.io,
        ticket.creatorId,
        'Mise à jour de ticket',
        `Le statut de votre ticket #${ticket.id} (${ticket.title}) est passé à ${status}.`,
        'INFO'
      )
    }

    req.io.emit('ticket_updated')
    res.json(ticket)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role === 'ADMIN') return res.status(403).json({ message: 'L\'administrateur ne peut pas supprimer de tickets' })
  if (req.user.role !== 'MANAGER') {
     const ticketCheck = await prisma.ticket.findUnique({ where: { id: parseInt(req.params.id) } })
     if (ticketCheck.creatorId !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })
  }
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!ticket) return res.status(404).json({ message: 'Ticket introuvable' })
    if (ticket.status !== 'RESOLVED') {
      return res.status(400).json({ message: 'Seuls les tickets résolus peuvent être supprimés' })
    }
    await prisma.ticket.delete({ where: { id: parseInt(req.params.id) } })
    req.io.emit('ticket_updated')
    res.json({ message: 'Ticket supprimé' })
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ message: 'Contenu requis' })
    
    // Vérifier si le ticket existe et si le user y a accès
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé' })
    if (req.user.role === 'COLLABORATOR' && ticket.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId: ticket.id,
        userId: req.user.id
      },
      include: { 
        user: { select: { id: true, name: true, avatar: true, role: true } },
        ticket: { include: { creator: true } }
      }
    })

    // Notify relevant parties
    if (req.user.id === ticket.creatorId) {
      // Notify Managers
      const managers = await prisma.user.findMany({ where: { role: 'MANAGER' } })
      for (const manager of managers) {
        await createNotification(
          req.io,
          manager.id,
          'Nouveau commentaire (Ticket)',
          `${req.user.name} a commenté son ticket #${ticket.id}.`,
          'INFO'
        )
      }
    } else {
      // Someone else commented (Manager or Admin), notify creator
      await createNotification(
        req.io,
        ticket.creatorId,
        'Nouveau commentaire (Ticket)',
        `${req.user.name} a répondu à votre ticket #${ticket.id}.`,
        'INFO'
      )
    }

    req.io.emit('ticket_updated')
    res.status(201).json(comment)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

module.exports = router
