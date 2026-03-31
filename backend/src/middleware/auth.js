const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou invalide' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès réservé aux administrateurs' })
  next()
}

const managerOrAdminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Accès refusé pour ce rôle' })
  }
  next()
}

const managerOnly = (req, res, next) => {
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Accès réservé aux Managers' })
  }
  next()
}

module.exports = { auth, adminOnly, managerOrAdminOnly, managerOnly }
