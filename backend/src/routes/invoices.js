const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { auth, managerOnly } = require('../middleware/auth')
const { createNotification } = require('../utils/notification')
const prisma = new PrismaClient()

router.use(auth)

const generateNumber = async () => {
  const count = await prisma.invoice.count()
  const year = new Date().getFullYear()
  return `FAC-${year}-${String(count + 1).padStart(4, '0')}`
}

router.get('/', async (req, res) => {
  try {
    const { role, id: userId } = req.user
    let where = {}

    if (role === 'COLLABORATOR') {
      where = {
        project: {
          collaborators: {
            some: { id: userId }
          }
        }
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: true, items: true, project: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(invoices)
  } catch (err) { 
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' }) 
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { role, id: userId } = req.user

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { client: true, items: true, project: true }
    })

    if (!invoice) return res.status(404).json({ message: 'Facture introuvable' })

    // Check access for collaborators
    if (role === 'COLLABORATOR') {
      const isCollab = await prisma.project.findFirst({
        where: {
          id: invoice.projectId,
          collaborators: { some: { id: userId } }
        }
      })
      if (!isCollab && invoice.projectId) {
        return res.status(403).json({ message: 'Accès restreint' })
      }
    }

    res.json(invoice)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/', managerOnly, async (req, res) => {
  try {
    const { 
      clientId, projectId, status, totalHT, TVA, totalTTC, items,
      companyName, companyAddress, companyPhone, companyEmail, companyLogo
    } = req.body
    const number = await generateNumber()
    const invoice = await prisma.invoice.create({
      data: {
        number, 
        clientId: parseInt(clientId),
        projectId: projectId ? parseInt(projectId) : null,
        status: status || 'PENDING',
        totalHT: parseFloat(totalHT) || 0,
        TVA: parseFloat(TVA) || 0,
        totalTTC: parseFloat(totalTTC) || 0,
        companyName: companyName || 'CPM Pro',
        companyAddress,
        companyPhone,
        companyEmail,
        companyLogo,
        items: { create: (items || []).map(i => ({ description: i.description, quantity: parseFloat(i.quantity), price: parseFloat(i.price) })) }
      },
      include: { 
        client: true, 
        items: true, 
        project: { include: { collaborators: true } } 
      }
    })

    // Notify collaborators of the project
    if (invoice.project && invoice.project.collaborators) {
      for (const collab of invoice.project.collaborators) {
        await createNotification(
          req.io,
          collab.id,
          'Nouvelle facture',
          `Une nouvelle facture ${invoice.number} a été émise pour le projet ${invoice.project.name}.`,
          'INFO'
        )
      }
    }

    req.io.emit('invoice_updated')
    res.status(201).json(invoice)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, totalHT, TVA, totalTTC, clientId, projectId } = req.body
    const { role, id: userId } = req.user

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingInvoice) return res.status(404).json({ message: 'Facture introuvable' })

    if (existingInvoice.status === 'PAID') {
      return res.status(400).json({ message: 'Une facture payée ne peut plus être modifiée' })
    }

    const updateData = {}

    if (role === 'COLLABORATOR') {
      // Collaborators can approve, reject, or mark as PAID (after approval)
      if (!['APPROVED', 'REJECTED', 'PAID'].includes(status)) {
        return res.status(403).json({ message: 'Action non autorisée pour ce rôle' })
      }
      
      const isCollab = await prisma.project.findFirst({
        where: {
          id: existingInvoice.projectId,
          collaborators: { some: { id: userId } }
        }
      })

      if (!isCollab && existingInvoice.projectId) {
        return res.status(403).json({ message: 'Accès restreint au projet' })
      }

      if (status === 'PAID' && existingInvoice.status !== 'APPROVED') {
        return res.status(400).json({ message: 'Une facture doit être approuvée par le collaborateur avant d\'être marquée comme payée' })
      }

      updateData.status = status
    } else {
      // Manager can update anything. Admin is READ-ONLY.
      if (role === 'ADMIN') {
        return res.status(403).json({ message: 'L\'administrateur est en lecture seule sur les factures' })
      }
      
      if (status) {
        if (status === 'PAID' && existingInvoice.status !== 'APPROVED') {
          return res.status(400).json({ message: 'Une facture doit être approuvée par le collaborateur avant d\'être marquée comme payée' })
        }
        updateData.status = status
      }
      if (totalHT !== undefined) updateData.totalHT = parseFloat(totalHT) || 0
      if (TVA !== undefined) updateData.TVA = parseFloat(TVA) || 0
      if (totalTTC !== undefined) updateData.totalTTC = parseFloat(totalTTC) || 0
      if (clientId !== undefined) updateData.clientId = parseInt(clientId)
      if (projectId !== undefined) updateData.projectId = projectId ? parseInt(projectId) : null
    }

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { client: true, items: true, project: { include: { creator: true } } }
    })

    // Notify manager if a collaborator approved/rejected
    if (role === 'COLLABORATOR' && ['APPROVED', 'REJECTED'].includes(status)) {
      if (invoice.project) {
        await createNotification(
          req.io,
          invoice.project.creatorId,
          'Décision sur facture',
          `${req.user.name} a ${status === 'APPROVED' ? 'approuvé' : 'rejeté'} la facture ${invoice.number}.`,
          status === 'APPROVED' ? 'SUCCESS' : 'WARNING'
        )
      }
    }

    req.io.emit('invoice_updated')
    res.json(invoice)
  } catch (err) {
    console.error('Erreur PUT Invoice:', err)
    res.status(500).json({ message: 'Erreur lors de la mise à jour' })
  }
})

router.delete('/:id', managerOnly, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!invoice) return res.status(404).json({ message: 'Facture introuvable' })
    
    // Only PAID or REJECTED invoices can be deleted
    if (!['PAID', 'REJECTED'].includes(invoice.status)) {
      return res.status(400).json({ message: 'Seules les factures payées ou rejetées peuvent être supprimées' })
    }
    await prisma.invoice.delete({ where: { id: parseInt(req.params.id) } })
    req.io.emit('invoice_updated')
    res.json({ message: 'Facture supprimée' })
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

module.exports = router

module.exports = router
