const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { auth, adminOnly } = require('../middleware/auth')

const prisma = new PrismaClient()

// Multer config for avatar uploads
const uploadDir = path.join(__dirname, '../../uploads/avatars')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Format d\'image non supporté'))
  }
})

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
        emailNotifications: true, browserNotifications: true
      }
    })
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

router.put('/me', auth, async (req, res) => {
  try {
    const { name, email } = req.body
    const data = {}
    if (name) data.name = name
    if (email) data.email = email

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true }
    })
    req.io.emit('user_updated')
    res.json(user)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/users/me/password
router.put('/me/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Tous les champs sont requis' })
    if (newPassword.length < 6) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' })

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) return res.status(400).json({ message: 'Ancien mot de passe incorrect' })

    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hash } })
    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/users/me/avatar
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' })

    // Delete old avatar if exists
    const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { avatar: true } })
    if (current?.avatar) {
      const oldPath = path.join(__dirname, '../../', current.avatar)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarPath },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true }
    })
    req.io.emit('user_updated')
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors de l\'upload' })
  }
})

// PUT /api/users/me/settings
router.put('/me/settings', auth, async (req, res) => {
  try {
    const { emailNotifications, browserNotifications } = req.body;
    const data = {};
    if (typeof emailNotifications === 'boolean') data.emailNotifications = emailNotifications;
    if (typeof browserNotifications === 'boolean') data.browserNotifications = browserNotifications;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
        emailNotifications: true, browserNotifications: true
      }
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Admin Routes

// GET /api/users
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, avatar: true, createdAt: true, isApproved: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/users/managers
router.get('/managers', auth, async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER', isApproved: true },
      select: { id: true, name: true, email: true }
    })
    res.json(managers)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/users/:id/approve
router.put('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isApproved: true },
      select: { id: true, name: true, email: true, role: true, avatar: true, isApproved: true }
    })
    req.io.emit('user_updated')
    res.json({ message: 'Utilisateur approuvé', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/users/:id/role
router.put('/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body
    if (!['ADMIN', 'MANAGER', 'COLLABORATOR'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' })
    }
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true, avatar: true, isApproved: true }
    })
    req.io.emit('user_updated')
    res.json({ message: 'Rôle mis à jour', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/users/:id/suspend
router.put('/:id/suspend', auth, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas suspendre votre propre compte' })
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: false },
      select: { id: true, name: true, email: true, role: true, avatar: true, isApproved: true }
    })
    req.io.emit('user_updated')
    res.json({ message: 'Utilisateur suspendu', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' })

    // Delete user (Prisma handles Cascade for comments/notifs)
    // Related projects/tickets creatorId will be set to NULL (handled by schema onDelete: SetNull)
    await prisma.user.delete({ where: { id: userId } })
    
    req.io.emit('user_updated')
    res.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' })
  }
})

module.exports = router
