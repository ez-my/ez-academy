/**
 * Firebase Cloud Messaging (FCM) — client-side token management.
 *
 * Usage:
 *   1. Call requestNotificationPermission() after the user logs in.
 *   2. The FCM token is stored in Firestore at users/{uid}.fcmToken.
 *   3. Call onForegroundMessage() to display in-app toasts for foreground pushes.
 *
 * Prerequisites (not yet done — see TEKNO skill for full setup steps):
 *   - VITE_FIREBASE_VAPID_KEY must be set in Netlify env vars
 *   - public/firebase-messaging-sw.js must exist (see scripts/generate-sw.mjs)
 *   - Firebase console: Project Settings → Cloud Messaging → Web Push certificates → generate key pair
 */

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { db, auth } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/**
 * Ask for notification permission and register the FCM token.
 * Safe to call multiple times — skips if already granted.
 * Returns the token string on success, null on denial or error.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (!VAPID_KEY) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not set — push notifications disabled.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      ),
    });

    const uid = auth.currentUser?.uid;
    if (uid && token) {
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: token,
        fcmTokenUpdatedAt: Date.now(),
        notificationsEnabled: true,
      });
    }

    return token;
  } catch (err) {
    console.error('[FCM] Token registration failed:', err);
    return null;
  }
}

/**
 * Revoke the FCM token and clear it from Firestore.
 * Call when the user disables notifications in settings.
 */
export async function revokeNotificationToken(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await updateDoc(doc(db, 'users', uid), {
      fcmToken: null,
      notificationsEnabled: false,
    });
  } catch (err) {
    console.error('[FCM] Token revocation failed:', err);
  }
}

/**
 * Listen for push messages while the app is in the foreground.
 * Returns an unsubscribe function — call it in component cleanup.
 *
 * @example
 *   useEffect(() => onForegroundMessage(p => toast(p.notification?.body)), []);
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  if (typeof window === 'undefined' || !VAPID_KEY) return () => {};
  const messaging = getMessaging(getApp());
  return onMessage(messaging, callback);
}
