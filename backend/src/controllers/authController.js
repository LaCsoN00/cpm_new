const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createNotification } = require('../utils/notification')

const prisma = new PrismaClient()

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    if (!user.isApproved) return res.status(403).json({ message: 'Votre compte est en attente d\'approbation par un administrateur.' })
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({ token, user: { 
      id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar,
      emailNotifications: user.emailNotifications, browserNotifications: user.browserNotifications
    } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    const hash = await bcrypt.hash(password, 10)
    
    // Sécurité : Personne ne peut s'auto-attribuer le rôle ADMIN via le body, sauf le tout premier utilisateur
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0
    let finalRole = 'COLLABORATOR'
    let finalApproved = false

    if (isFirstUser) {
      finalRole = 'ADMIN'
      finalApproved = true
    } else {
      // On ignore le rôle passé dans le body s'il n'est pas permis ou si on veut forcer COLLABORATOR
      finalRole = (role && (role === 'MANAGER' || role === 'COLLABORATOR')) ? role : 'COLLABORATOR'
      finalApproved = false
    }
    
    const user = await prisma.user.create({ 
      data: { name, email, password: hash, role: finalRole, isApproved: finalApproved } 
    })
    
    // Notification de bienvenue pour l'utilisateur
    await createNotification(
      user.id,
      'Bienvenue sur CPM ! 🎉',
      finalApproved 
        ? 'Votre compte a été créé avec succès. Vous pouvez maintenant gérer vos projets et tickets.'
        : 'Votre compte a été créé. Il est en attente d\'approbation par un administrateur.',
      'SUCCESS'
    )

    // Alerter les administrateurs si un compte attend une validation
    if (!finalApproved) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'Nouvelle inscription à valider 👤',
          `L'utilisateur ${name} (${email}) s'est inscrit et attend votre validation.`,
          'WARNING'
        )
      }
    }
    
    if (!finalApproved) {
      return res.status(201).json({ message: 'Inscription réussie. Votre compte est en attente d\'approbation par un administrateur.' })
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.status(201).json({ token, user: { 
      id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar,
      emailNotifications: user.emailNotifications, browserNotifications: user.browserNotifications,
      isApproved: user.isApproved
    } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { login, register }
