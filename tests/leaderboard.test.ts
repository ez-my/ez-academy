import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLeaderboard } from '../src/server/communityRoutes';

const ADMIN = 'ezacademy.my@gmail.com';

const user = (uid: string, data: Record<string, unknown>) => ({ uid, data });

test('only public fields reach the board', () => {
  const [row] = buildLeaderboard([
    user('u1', {
      displayName: 'Nur Aisyah', school: 'SMK Taman Desa', points: 900, level: 'ADVANCED',
      email: 'nur@example.com', plan: 'ez_plus', credits: 42, photoURL: 'https://example.com/a.jpg',
      usage: { speak: 9 }, streak: 12,
    }),
  ], 'viewer', ADMIN);

  assert.deepEqual(Object.keys(row).sort(), ['displayName', 'isYou', 'level', 'points', 'rank', 'school', 'uid']);
  assert.equal((row as any).email, undefined, 'an email address must never reach a public board');
  assert.equal((row as any).plan, undefined);
  assert.equal((row as any).credits, undefined);
  assert.equal((row as any).photoURL, undefined);
});

test('opted-out learners are left off entirely', () => {
  const rows = buildLeaderboard([
    user('u1', { displayName: 'Top', points: 900, leaderboardOptOut: true }),
    user('u2', { displayName: 'Next', points: 800 }),
  ], 'viewer', ADMIN);

  assert.deepEqual(rows.map(r => r.uid), ['u2']);
  assert.equal(rows[0].rank, 1, 'ranks are assigned after the opt-out is applied, so there is no gap at the top');
});

test('the admin account is not ranked against the learners', () => {
  const rows = buildLeaderboard([
    user('admin', { displayName: 'EZ Academy', points: 99999, email: ADMIN }),
    user('u1', { displayName: 'Nur', points: 500 }),
  ], 'viewer', ADMIN);
  assert.deepEqual(rows.map(r => r.uid), ['u1']);
});

test('the viewer is marked so the board can highlight them', () => {
  const rows = buildLeaderboard([
    user('u1', { displayName: 'Nur', points: 500 }),
    user('me', { displayName: 'Ali', points: 400 }),
  ], 'me', ADMIN);
  assert.deepEqual(rows.map(r => r.isYou), [false, true]);
});

test('rows are ranked by points regardless of the order they arrive in', () => {
  const rows = buildLeaderboard([
    user('a', { displayName: 'A', points: 10 }),
    user('b', { displayName: 'B', points: 300 }),
    user('c', { displayName: 'C', points: 200 }),
  ], 'viewer', ADMIN);
  assert.deepEqual(rows.map(r => [r.rank, r.uid]), [[1, 'b'], [2, 'c'], [3, 'a']]);
});

test('a missing name or school never renders as "undefined"', () => {
  const [row] = buildLeaderboard([user('u1', { points: 5 })], 'viewer', ADMIN);
  assert.equal(row.displayName, 'EZ learner');
  assert.equal(row.school, '', 'an empty school is an empty string the UI can skip, not the text "undefined"');
  assert.equal(row.level, 'BEGINNER');
});

test('hostile profile values cannot distort the board', () => {
  const [row] = buildLeaderboard([
    user('u1', { displayName: '   ', school: ' '.repeat(400) + 'X', points: -999, level: { evil: true } }),
  ], 'viewer', ADMIN);
  assert.equal(row.displayName, 'EZ learner');
  assert.equal(row.school, 'X');
  assert.equal(row.points, 0, 'negative points are floored rather than ranking below zero');
  assert.equal(row.level, 'BEGINNER', 'a non-string level falls back instead of rendering an object');
});

test('the board is capped even when far more users are scanned', () => {
  const many = Array.from({ length: 40 }, (_, i) => user(`u${i}`, { displayName: `U${i}`, points: 1000 - i }));
  assert.equal(buildLeaderboard(many, 'viewer', ADMIN).length, 10);
});

test('opt-outs are replaced by the next learners, not left as holes', () => {
  const many = Array.from({ length: 20 }, (_, i) =>
    user(`u${i}`, { displayName: `U${i}`, points: 1000 - i, leaderboardOptOut: i < 5 }));
  const rows = buildLeaderboard(many, 'viewer', ADMIN);
  assert.equal(rows.length, 10);
  assert.deepEqual(rows.map(r => r.uid), ['u5','u6','u7','u8','u9','u10','u11','u12','u13','u14']);
  assert.deepEqual(rows.map(r => r.rank), [1,2,3,4,5,6,7,8,9,10]);
});
