const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// @route   POST /api/push-subscriptions
// @desc    Subscribe current user to push notifications
router.post('/subscribe', auth, async (req, res) => {
  const { subscription } = req.body;
  
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ message: 'Invalid subscription object' });
  }

  try {
    const { endpoint, keys } = subscription;
    
    // Upsert the subscription (endpoint is unique)
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    res.status(201).json(sub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving push subscription' });
  }
});

// @route   DELETE /api/push-subscriptions/unsubscribe
// @desc    Unsubscribe current user (using endpoint as key)
router.delete('/unsubscribe', auth, async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ message: 'Endpoint required for unsubscribing' });
  }

  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting push subscription' });
  }
});

module.exports = router;
