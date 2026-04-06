const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { sendNotification } = require('./push')

/**
 * Creates a notification for a specific user
 * @param {object} io - The socket.io instance
 * @param {number} userId - The ID of the user to notify
 * @param {string} title - The title of the notification
 * @param {string} message - The content of the notification
 * @param {string} type - INFO, SUCCESS, WARNING, or ERROR
 */
const createNotification = async (io, userId, title, message, type = 'INFO') => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, browserNotifications: true }
    })
    
    if (!user) return;

    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    })

    // Fetch user subscriptions for Web Push
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length > 0) {
      // Logic for sounds: we send the payload, the Service Worker handles the rest
      await sendNotification(subscriptions, {
        title,
        body: message,
        icon: '/icon-192x192.png',
        badge: '/favicon.ico',
        tag: 'cpm-notification', // Collapse multiple notifications
        data: {
          url: '/' // Can be improved to link to the specific ticket/project
        }
      })
    }

    // Emit socket event for real-time update
    if (io) {
      io.emit('notification_updated', { userId })
    }
  } catch (err) {
    console.error('Failed to create notification', err)
  }
}


module.exports = { createNotification }
