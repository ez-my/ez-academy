// What a learner's points mean, and who is allowed to decide them.
//
// Points used to be incremented by the browser inside saveSession, from a score
// the browser also supplied. That was survivable while nothing ranked on them.
// The leaderboard ranks on them, so the award moved to the server.
//
// The server cannot award on score. It never sees a speaking or writing score:
// those come back through the AI proxy as free text and are parsed on the
// client. What the server can prove is that a practice really happened, because
// it is the thing that checks the daily allowance and spends it. So points are
// awarded per practice consumed, which is unforgeable, and bounded by the daily
// allowance a learner already has.
//
// Pure: no I/O, no Firebase, so the rule the UI explains is the rule enforced.

/** Awarded once per practice the server actually spends allowance on. */
export const POINTS_PER_PRACTICE = 10;

/** A full mock test is longer than a single practice, so it is worth more. */
export const POINTS_PER_FULL_TEST = 25;

/** Granted once when a profile is created. The rules cap creation at this. */
export const POINTS_ON_SIGNUP = 100;

/**
 * Points for one consumed practice.
 * `mock` is the server's own flag for a full test, not something a client sends
 * along with a score.
 */
export function pointsForPractice(mock = false): number {
  return mock ? POINTS_PER_FULL_TEST : POINTS_PER_PRACTICE;
}

/**
 * Fold an award into a stored total.
 * Reads defensively because the stored value predates server ownership: it was
 * client-written for the whole life of the app and may be anything.
 */
export function awardPoints(current: unknown, award: number): number {
  const base = Number(current);
  const safeBase = Number.isFinite(base) && base > 0 ? Math.floor(base) : 0;
  const safeAward = Number.isFinite(award) && award > 0 ? Math.floor(award) : 0;
  return safeBase + safeAward;
}
