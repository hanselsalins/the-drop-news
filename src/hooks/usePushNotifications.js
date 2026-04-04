import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function hexToUint8Array(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
}

export function usePushNotifications() {
  const { token } = useTheme();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    if (supported) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
        });
      }).catch(() => {});
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !token) return false;
    setIsLoading(true);
    try {
      // Register SW (skip in iframes / preview hosts)
      const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
      const isPreview = window.location.hostname.includes('id-preview--') || window.location.hostname.includes('lovableproject.com');
      if (isInIframe || isPreview) {
        setIsLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidRes = await axios.get(`${BACKEND_URL}/api/push/vapid-public-key`);
      const vapidKey = vapidRes.data.public_key || vapidRes.data.publicKey || vapidRes.data;
      const applicationServerKey = hexToUint8Array(typeof vapidKey === 'string' ? vapidKey : '');

      // Request permission & subscribe
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setIsLoading(false); return false; }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to backend
      await axios.post(`${BACKEND_URL}/api/push/subscribe`,
        { subscription: subscription.toJSON() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error('[Push] subscribe error:', e);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, token]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        // Notify backend
        try {
          await axios.post(`${BACKEND_URL}/api/push/unsubscribe`,
            { endpoint: sub.endpoint },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {}
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error('[Push] unsubscribe error:', e);
    }
    setIsLoading(false);
  }, [isSupported, token]);

  return { isSupported, isSubscribed, subscribe, unsubscribe, isLoading };
}
