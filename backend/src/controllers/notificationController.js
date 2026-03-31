const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50
    })
    res.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' })
  }
}

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const notification = await prisma.notification.updateMany({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      },
      data: { isRead: true }
    })
    
    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification introuvable' })
    }
    
    if (req.io) req.io.emit('notification_updated', { userId: req.user.id })
    res.json({ message: 'Notification marquée comme lue' })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour' })
  }
}

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    })
    
    if (req.io) req.io.emit('notification_updated', { userId: req.user.id })
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour' })
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params
    const notification = await prisma.notification.deleteMany({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      }
    })
    
    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification introuvable' })
    }
    
    res.json({ message: 'Notification supprimée' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ message: 'Erreur lors de la suppression' })
  }
}

exports.deleteAllNotifications = async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id }
    })
    
    res.json({ message: 'Toutes les notifications ont été supprimées' })
  } catch (error) {
    console.error('Error deleting all notifications:', error)
    res.status(500).json({ message: 'Erreur lors de la suppression' })
  }
}
