const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')
const { auth } = require('../middleware/auth')

router.use(auth)

router.get('/', notificationController.getUserNotifications)
router.put('/read-all', notificationController.markAllAsRead)
router.put('/:id/read', notificationController.markAsRead)
router.delete('/', notificationController.deleteAllNotifications)
router.delete('/:id', notificationController.deleteNotification)

module.exports = router
