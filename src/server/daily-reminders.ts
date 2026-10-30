/**
 * src/server/daily-reminders.ts
 *
 * Netlify scheduled function: fires once daily at 08:00 Malaysia time (UTC 00:00).
 * Triggers the ops-background pattern: verify secret → call background worker.
 *
 * Schedule: "0 0 * * *"  (midnight UTC = 8 AM MYT)
 *
 * To add to netlify.toml:
 *   [functions."daily-reminders"]
 *     schedule = "0 0 * * *"
 */

import { timingSafeEqual } from 'node:crypto';
import { initializeExistingFirebase } from './firebaseAdmin';
import { sendDailyReminders } from './dailyReminders';

export const config = { schedule: '0 0 * * *' };

export default async function handler(request: Request): Promise<Response> {
  // Guard: only run in production with a valid secret
  if (process.env.MIGRATION_MODE !== 'production') {
    return new Response('Production only', { status: 403 });
  }

  const expected = process.env.OPS_RUN_SECRET || '';
  const actual = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  ) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { database } = initializeExistingFirebase();
    const payload = await request.json().catch(() => ({})) as { dryRun?: boolean };
    const result = await sendDailyReminders(database, { dryRun: payload.dryRun === true });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[daily-reminders] Failed:', err);
    return new Response('Reminder dispatch failed', { status: 500 });
  }
}
