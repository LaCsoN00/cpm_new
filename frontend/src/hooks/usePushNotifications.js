import { useState, useEffect } from 'react';
import api from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BJKwBsw-vjVGdyS_P0oq1YZXHs2hU6EYc3fYCeKKOBumZ9V8lV4MRNepEYVHsXjd2f7CFRnNj7_OpVIX83MEZhs";

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Permission not granted');
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send to backend
      const subJSON = sub.toJSON();
      await api.post('/push-subscriptions/subscribe', {
        subscription: {
          endpoint: subJSON.endpoint,
          keys: subJSON.keys
        }
      });

      setSubscription(sub);
      return true;
    } catch (err) {
      console.error('Failed to subscribe:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      if (subscription) {
        await api.delete('/push-subscriptions/unsubscribe', {
          data: { endpoint: subscription.endpoint }
        });
        await subscription.unsubscribe();
        setSubscription(null);
      }
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    subscription,
    loading,
    subscribeUser,
    unsubscribeUser,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window
  };
}
