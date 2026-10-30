/**
 * scripts/generate-sw.mjs
 *
 * Generates public/firebase-messaging-sw.js from firebase-applet-config.json.
 * Run automatically as part of `npm run build:netlify` (add to package.json scripts).
 *
 * Usage:
 *   node scripts/generate-sw.mjs
 *
 * The Firebase JS SDK apiKey is public by design — it identifies the project,
 * security is enforced by Firestore Rules and Auth, not by hiding the key.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  readFileSync(join(__dirname, '..', 'firebase-applet-config.json'), 'utf8')
);

// Firebase SDK version — keep in sync with package.json firebase version major
const SDK_VERSION = '10.14.1';

const sw = `// AUTO-GENERATED — do not edit manually. Run: node scripts/generate-sw.mjs
// Firebase Cloud Messaging service worker for EZ Academy.
// Handles background push notifications when the app tab is not active.

importScripts('https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: ${JSON.stringify(config.apiKey)},
  authDomain: ${JSON.stringify(config.authDomain)},
  projectId: ${JSON.stringify(config.projectId)},
  storageBucket: ${JSON.stringify(config.storageBucket)},
  messagingSenderId: ${JSON.stringify(config.messagingSenderId)},
  appId: ${JSON.stringify(config.appId)},
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'EZ Academy', {
    body: body || 'Masa untuk latihan English! 🎯',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'ez-academy-reminder',
    renotify: true,
    data: payload.data || {},
  });
});

// Open or focus the app when the user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://ez-academy.my';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('ez-academy.my') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
`;

writeFileSync(join(__dirname, '..', 'public', 'firebase-messaging-sw.js'), sw);
console.log('✅  public/firebase-messaging-sw.js generated from firebase-applet-config.json');
