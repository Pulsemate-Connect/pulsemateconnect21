import { useEffect, useRef } from 'react';
import { registerFcmToken, removeFcmToken } from '../api/notification.api';
import useAuthStore from '../store/authStore';

/**
 * useFcm — registers the browser for Firebase push notifications.
 *
 * REQUIRES these env vars in frontend/.env:
 *   VITE_FIREBASE_API_KEY=...
 *   VITE_FIREBASE_AUTH_DOMAIN=...
 *   VITE_FIREBASE_PROJECT_ID=...
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *   VITE_FIREBASE_APP_ID=...
 *   VITE_FIREBASE_VAPID_KEY=...
 *
 * firebase package: npm install firebase  (already listed in package.json)
 *
 * Without env vars this hook is a safe no-op — the app works fine.
 * The firebase-messaging-sw.js service worker in /public enables background push.
 */
const useFcm = () => {
  const { isAuthenticated } = useAuthStore();
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!import.meta.env.VITE_FIREBASE_API_KEY) return; // FCM not configured — skip silently
    if (!('Notification' in window)) return; // browser doesn't support notifications

    let cleanup = () => { };

    const init = async () => {
      try {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const messaging = getMessaging(app);

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[FCM] Notification permission denied');
          return;
        }

        // Register the service worker for background push (firebase-messaging-sw.js)
        let swRegistration;
        try {
          if ('serviceWorker' in navigator) {
            swRegistration = await navigator.serviceWorker.register(
              '/firebase-messaging-sw.js',
              { scope: '/' }
            );
            // Send Firebase config to the service worker so it can initialize Firebase
            await navigator.serviceWorker.ready;
            if (swRegistration.active) {
              swRegistration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: firebaseConfig,
              });
            }
          }
        } catch (swErr) {
          console.warn('[FCM] Service worker registration failed — background push disabled:', swErr.message);
        }

        // Get FCM push token (uses the registered SW if available)
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
        });
        if (!token) return;

        tokenRef.current = token;
        await registerFcmToken(token, 'web');
        console.log('[FCM] Web push token registered ✓');

        // Handle foreground notifications — show native browser notification
        const unsubscribe = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          const { type, appointmentId } = payload.data || {};

          if (title && Notification.permission === 'granted') {
            const notifUrl = buildNotifUrl(type, appointmentId);
            const notif = new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: type || 'pulsemate',
              renotify: true,
            });
            notif.onclick = () => {
              window.focus();
              window.location.href = notifUrl;
            };
          }
        });

        cleanup = () => {
          unsubscribe();
          if (tokenRef.current) {
            removeFcmToken(tokenRef.current).catch(() => { });
            tokenRef.current = null;
          }
        };
      } catch (err) {
        console.warn('[FCM] Setup skipped:', err.message);
      }
    };

    init();
    return () => cleanup();
  }, [isAuthenticated]);
};

/**
 * Build notification click URL based on notification type.
 */
function buildNotifUrl(type, appointmentId) {
  switch (type) {
    case 'QUEUE_CALLED':
    case 'QUEUE_UPDATE':
    case 'QUEUE_RESUMED':
      return appointmentId ? `/patient/queue/${appointmentId}` : '/patient/appointments';
    case 'APPOINTMENT_BOOKED':
    case 'APPOINTMENT_CANCELLED':
      return appointmentId ? `/patient/appointments/${appointmentId}` : '/patient/appointments';
    default:
      return '/notifications';
  }
}

export default useFcm;
