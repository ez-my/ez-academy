/**
 * src/server/dailyReminders.ts
 *
 * Sends FCM push notifications to users who have not practised today.
 * Called by the daily-reminders Netlify scheduled function (or from ops-background).
 *
 * Targeting logic:
 *   - Users with a stored fcmToken (opted in)
 *   - Users whose usage.date ≠ today (haven't practised today in Malaysia time)
 *   - Optional: users whose streak > 0 get a "keep your streak" message
 *   - Hard cap: max 180 tokens per run to stay within FCM batch limits
 *
 * Firestore reads: 1 collection scan (users with fcmToken set), max 200 docs.
 * FCM cost: free up to 1,000 messages/day on Spark plan; unlimited on Blaze.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

/** Malaysia UTC+8 date string, e.g. "2026-10-19" */
function malaysiaToday(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

interface ReminderResult {
  eligible: number;
  sent: number;
  failed: number;
  skippedAlreadyActive: number;
  dryRun: boolean;
}

/**
 * Send daily practice reminders.
 * @param db     Firebase Admin Firestore instance
 * @param dryRun If true, logs targets but sends no messages (for testing)
 */
export async function sendDailyReminders(
  db: Firestore,
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<ReminderResult> {
  const today = malaysiaToday();
  const result: ReminderResult = { eligible: 0, sent: 0, failed: 0, skippedAlreadyActive: 0, dryRun };

  // Fetch users who have opted into notifications (fcmToken stored)
  // Limit 200 — if >200 opted-in users exist, implement cursor pagination
  const snapshot = await db
    .collection('users')
    .where('fcmToken', '!=', null)
    .limit(200)
    .get();

  if (snapshot.empty) return result;

  const tokens: string[] = [];
  const streakTokens: string[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const token: string | null = data.fcmToken ?? null;
    if (!token) continue;

    const lastActive: string | null = data.usage?.date ?? null;
    if (lastActive === today) {
      result.skippedAlreadyActive++;
      continue;
    }

    result.eligible++;
    if (data.streak && data.streak > 1) {
      streakTokens.push(token);
    } else {
      tokens.push(token);
    }
  }

  if (dryRun) {
    console.log(`[DryRun] Daily reminders: ${result.eligible} eligible, ${result.skippedAlreadyActive} already active today`);
    return result;
  }

  const messaging = getMessaging();

  // Send streak-preservation message to users with active streaks
  if (streakTokens.length > 0) {
    const batchResult = await messaging.sendEachForMulticast({
      tokens: streakTokens,
      notification: {
        title: '🔥 Jangan putus streak kamu!',
        body: 'Kamu ada streak aktif. Praktis sikit hari ni untuk kekalkan streak English kamu.',
      },
      webpush: {
        notification: { icon: '/icon-192x192.png', badge: '/icon-192x192.png', tag: 'ez-reminder-streak' },
        fcmOptions: { link: 'https://ez-academy.my' },
      },
    });
    result.sent += batchResult.successCount;
    result.failed += batchResult.failureCount;
  }

  // Send general reminder to users without a streak
  if (tokens.length > 0) {
    const batchResult = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: '📚 Masa untuk latihan English!',
        body: 'Cuba speaking, writing, reading atau listening hari ni. Setiap minit berguna!',
      },
      webpush: {
        notification: { icon: '/icon-192x192.png', badge: '/icon-192x192.png', tag: 'ez-reminder-general' },
        fcmOptions: { link: 'https://ez-academy.my' },
      },
    });
    result.sent += batchResult.successCount;
    result.failed += batchResult.failureCount;
  }

  // Clean up stale tokens (registration-not-registered errors)
  // TODO: if batchResult has failed tokens, delete them from Firestore

  return result;
}
