import type express from 'express';
import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import {
  SHARE_REWARD_MAX_PER_ACCOUNT,
  claimShareReward,
  isSharePlatform,
  readShareState,
  shareAvailability,
  tidyText,
  MAX_SCHOOL_LENGTH,
  MAX_NAME_LENGTH,
} from '../profileFields';
import { malaysiaPracticeDay } from './practicePolicy';

const LEADERBOARD_SIZE = 10;
/** Read a few more than we show, because opted-out learners are dropped afterwards. */
const LEADERBOARD_SCAN = 40;

export interface LeaderboardRow {
  rank: number;
  uid: string;
  displayName: string;
  school: string;
  points: number;
  level: string;
  isYou: boolean;
}

/**
 * Build the public board from raw user documents.
 * Pure, so the field allowlist and the opt-out are testable without Firestore.
 * Only the four fields below ever leave this function: the stored profile also
 * holds email, plan, credits and usage, none of which belong on a public board.
 */
export function buildLeaderboard(
  users: { uid: string; data: Record<string, unknown> }[],
  viewerUid: string,
  adminEmail: string,
  size = LEADERBOARD_SIZE,
): LeaderboardRow[] {
  return users
    .filter(user => user.data.leaderboardOptOut !== true)
    .filter(user => String(user.data.email || '') !== adminEmail)
    .map(user => ({
      uid: user.uid,
      displayName: tidyText(user.data.displayName, MAX_NAME_LENGTH) || 'EZ learner',
      school: tidyText(user.data.school, MAX_SCHOOL_LENGTH),
      points: Math.max(0, Math.floor(Number(user.data.points) || 0)),
      level: typeof user.data.level === 'string' ? user.data.level : 'BEGINNER',
      isYou: user.uid === viewerUid,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, size)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function registerCommunityRoutes(
  app: express.Express,
  db: Firestore,
  adminEmail: string,
  verifyOverride?: (token: string) => Promise<{ uid: string }>,
) {
  const verify = async (req: any) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw Object.assign(Error('Please sign in again.'), { status: 401 });
    try {
      return verifyOverride ? await verifyOverride(token) : await getAuth().verifyIdToken(token);
    } catch {
      throw Object.assign(Error('Please sign in again.'), { status: 401 });
    }
  };
  const fail = (res: any, error: any) =>
    res.status(error.status || 503).json({ error: error.status ? error.message : 'Something went wrong. Please try again.' });

  // Signed in only. The board carries a learner's name together with their school,
  // and most of these learners are schoolchildren, so it is not served to anonymous
  // callers. It was previously open to the whole internet.
  app.get('/api/leaderboard', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const viewer = await verify(req);
      const snapshot = await db.collection('users').orderBy('points', 'desc').limit(LEADERBOARD_SCAN).get();
      const rows = buildLeaderboard(
        snapshot.docs.map(doc => ({ uid: doc.id, data: doc.data() as Record<string, unknown> })),
        viewer.uid,
        adminEmail,
      );
      return res.json({ success: true, leaderboard: rows });
    } catch (error: any) {
      if (error.status === 401) return fail(res, error);
      console.error('Leaderboard failed:', error);
      // The dashboard renders around a missing board rather than breaking.
      return res.status(200).json({ success: false, error: 'The leaderboard is temporarily unavailable.', leaderboard: [] });
    }
  });

  app.get('/api/share/status', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const user = await verify(req);
      const snapshot = await db.doc(`share_rewards/${user.uid}`).get();
      const day = malaysiaPracticeDay();
      return res.json({ day, max: SHARE_REWARD_MAX_PER_ACCOUNT, ...shareAvailability(readShareState(snapshot.data()), day) });
    } catch (error) {
      return fail(res, error);
    }
  });

  /**
   * Grant one extra practice for sharing a finished exercise.
   *
   * There is no way to verify that a share actually happened: no platform reports
   * it back, and navigator.share resolves even when the sheet is dismissed. The
   * reward is therefore taken on trust and bounded instead -- one a day, seven per
   * account, counted here where the learner cannot reach it. The grant lands in
   * package_entitlements.rewardPracticeCredits, which is the same pool reward codes
   * use and which consumePracticeWithReward already spends.
   */
  app.post('/api/share/claim', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const user = await verify(req);
      const { platform } = req.body || {};
      if (!isSharePlatform(platform)) throw Object.assign(Error('Choose where you shared it.'), { status: 400 });

      const day = malaysiaPracticeDay();
      const stateRef = db.doc(`share_rewards/${user.uid}`);
      const ledgerRef = db.doc(`package_entitlements/${user.uid}`);

      const outcome = await db.runTransaction(async transaction => {
        // Both reads happen before any write, as Firestore transactions require.
        const [stateSnap, ledgerSnap] = await Promise.all([transaction.get(stateRef), transaction.get(ledgerRef)]);
        const decision = claimShareReward(readShareState(stateSnap.data()), day);
        if (!decision.granted) return decision;

        transaction.set(stateRef, { ...decision.next, updatedAt: Date.now(), lastPlatform: platform }, { merge: true });
        transaction.set(
          ledgerRef,
          { rewardPracticeCredits: Number(ledgerSnap.data()?.rewardPracticeCredits || 0) + 1 },
          { merge: true },
        );
        // An audit row, so the admin can see how the rewards are being used.
        transaction.set(db.doc(`share_rewards/${user.uid}/claims/${day}`), {
          day, platform, at: Date.now(), total: decision.next.total,
        });
        return decision;
      });

      if (!outcome.granted) return res.status(429).json({ error: outcome.message, remaining: outcome.remaining });
      return res.json({ granted: true, message: outcome.message, remaining: outcome.remaining });
    } catch (error) {
      return fail(res, error);
    }
  });
}
