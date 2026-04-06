const webpush = require('web-push');

// Generate these or get them from .env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@cpm-new.com',
  publicVapidKey,
  privateVapidKey
);

/**
 * Sends a push notification to one or many subscriptions
 * @param {Array|Object} subscriptions - One or many push subscription objects
 * @param {Object} payload - Notification payload (title, body, icon, etc.)
 */
const sendNotification = async (subscriptions, payload) => {
  const subs = Array.isArray(subscriptions) ? subscriptions : [subscriptions];
  
  const results = await Promise.allSettled(
    subs.map(sub => {
      // Reconstruct the subscription object for web-push
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
    })
  );

  // Filter out expired/invalid subscriptions to remove them later if needed
  const failedSubscriptions = results
    .map((res, i) => (res.status === 'rejected' ? subs[i] : null))
    .filter(Boolean);

  return {
    successCount: results.length - failedSubscriptions.length,
    failedSubscriptions
  };
};

module.exports = {
  sendNotification,
  publicVapidKey
};
