const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { auth, managerOnly } = require('../middleware/auth')
const prisma = new PrismaClient()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })
    res.json(clients)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.post('/', managerOnly, async (req, res) => {
  try {
    const { name, company, email, phone } = req.body
    const client = await prisma.client.create({ data: { name, company, email, phone } })
    req.io.emit('client_updated')
    res.status(201).json(client)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.put('/:id', managerOnly, async (req, res) => {
  try {
    const { name, company, email, phone } = req.body
    const client = await prisma.client.update({ where: { id: parseInt(req.params.id) }, data: { name, company, email, phone } })
    req.io.emit('client_updated')
    res.json(client)
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

router.delete('/:id', managerOnly, async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: parseInt(req.params.id) } })
    req.io.emit('client_updated')
    res.json({ message: 'Client supprimé' })
  } catch (err) { res.status(500).json({ message: 'Erreur serveur' }) }
})

module.exports = router
