// ─────────────────────────────────────────────────────────────────────────────
//  Firebase Messaging Service Worker — PulseMate Web
//
//  Required for background push notifications to work in browsers.
//  This file MUST be served from the root path: /firebase-messaging-sw.js
//  Vite serves files in /public at the root automatically.
//
//  Firebase config is injected via postMessage from useFcm.js,
//  or you can hardcode the config here for simplicity (public keys are safe).
//
//  To enable background push:
//  1. Deploy with VITE_FIREBASE_* env vars set in frontend/.env
//  2. This service worker will be picked up automatically by Firebase SDK
// ─────────────────────────────────────────────────────────────────────────────

// Import Firebase scripts from CDN (versioned for reliability)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ── Firebase config ───────────────────────────────────────────────────────────
// These are injected by the client via postMessage when it registers the SW.
// The SW listens for a 'FIREBASE_CONFIG' message and initializes Firebase.
// This avoids hardcoding config here while keeping the file static.

let messagingInstance = null;

// Listen for config message from useFcm.js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!config?.apiKey || messagingInstance) return;

    try {
      const app = firebase.initializeApp(config);
      messagingInstance = firebase.messaging(app);

      // Handle background messages
      messagingInstance.onBackgroundMessage((payload) => {
        const { title = 'PulseMate', body = '' } = payload.notification || {};
        const { appointmentId, type } = payload.data || {};

        // Build the notification
        const notificationOptions = {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: type || 'pulsemate-notification',
          renotify: true,
          data: { appointmentId, type, url: buildNotifUrl(type, appointmentId) },
        };

        self.registration.showNotification(title, notificationOptions);
      });
    } catch (err) {
      console.warn('[SW] Firebase init failed:', err.message);
    }
  }
});

// Click on a background notification → open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// ── Helper — build notification click URL ─────────────────────────────────────
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
