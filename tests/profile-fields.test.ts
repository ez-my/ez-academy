import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_SHARE_STATE,
  SHARE_REWARD_MAX_PER_ACCOUNT,
  claimShareReward,
  isReferralSource,
  normaliseDetails,
  readShareState,
  referralSourceLabel,
  shareAvailability,
  validateDetails,
} from '../src/profileFields';

test('only known referral sources are accepted', () => {
  assert.equal(isReferralSource('tiktok'), true);
  assert.equal(isReferralSource('myspace'), false);
  assert.equal(isReferralSource(''), false);
  assert.equal(isReferralSource(null), false);
  assert.equal(referralSourceLabel('teacher'), 'My teacher');
  assert.equal(referralSourceLabel('myspace'), 'Not answered');
});

test('details are trimmed, collapsed and capped', () => {
  const details = normaliseDetails({
    displayName: '   Nur   Aisyah   ',
    school: '  SMK   Taman   Desa  ',
    referralSource: 'instagram',
  });
  assert.equal(details.displayName, 'Nur Aisyah');
  assert.equal(details.school, 'SMK Taman Desa', 'runs of whitespace would otherwise shove the school out of its leaderboard column');
  assert.equal(details.referralSource, 'instagram');
});

test('a long name cannot crowd out the school next to it', () => {
  const details = normaliseDetails({ displayName: 'a'.repeat(500), school: 'b'.repeat(500) });
  assert.equal(details.displayName.length, 60);
  assert.equal(details.school.length, 120);
});

test('normalising drops every field it does not own', () => {
  const details = normaliseDetails({ displayName: 'Ali', plan: 'ez_plus', credits: 9999, points: 50000 } as any);
  assert.deepEqual(Object.keys(details).sort(), ['displayName', 'leaderboardOptOut', 'referralNote', 'referralSource', 'school']);
  assert.equal((details as any).plan, undefined, 'a form must not be able to smuggle a plan in beside a school name');
  assert.equal((details as any).credits, undefined);
});

test('an unknown referral source is discarded rather than stored', () => {
  assert.equal(normaliseDetails({ displayName: 'Ali', referralSource: 'myspace' as any }).referralSource, '');
});

test('the free-text note is kept only against "somewhere else"', () => {
  assert.equal(normaliseDetails({ displayName: 'Ali', referralSource: 'tiktok', referralNote: 'from a poster' }).referralNote, '');
  assert.equal(normaliseDetails({ displayName: 'Ali', referralSource: 'other', referralNote: 'from a poster' }).referralNote, 'from a poster');
});

test('registration asks for everything; a later edit does not', () => {
  const bare = normaliseDetails({ displayName: 'Ali' });
  assert.deepEqual(validateDetails(bare), []);
  assert.equal(validateDetails(bare, { requireAll: true }).length, 2);
  assert.deepEqual(validateDetails(normaliseDetails({ displayName: '' })), ['Please enter your name.']);
});

test('a share reward is granted once and only once in a day', () => {
  const first = claimShareReward(EMPTY_SHARE_STATE, '2026-11-01');
  assert.equal(first.granted, true);
  assert.equal(first.next.total, 1);

  const again = claimShareReward(first.next, '2026-11-01');
  assert.equal(again.granted, false);
  assert.match(again.message, /already claimed/);
  assert.equal(again.next.total, 1, 'a refused claim must not move the counter');

  const tomorrow = claimShareReward(first.next, '2026-11-02');
  assert.equal(tomorrow.granted, true);
  assert.equal(tomorrow.next.total, 2);
});

test('an account stops at seven rewards however many days pass', () => {
  let state = EMPTY_SHARE_STATE;
  for (let day = 1; day <= SHARE_REWARD_MAX_PER_ACCOUNT; day += 1) {
    const result = claimShareReward(state, `2026-11-${String(day).padStart(2, '0')}`);
    assert.equal(result.granted, true, `day ${day} should be granted`);
    state = result.next;
  }
  assert.equal(state.total, 7);

  const eighth = claimShareReward(state, '2026-11-08');
  assert.equal(eighth.granted, false);
  assert.match(eighth.message, /all 7 share rewards/);
  assert.equal(eighth.next.total, 7);
});

test('the last reward says so instead of offering more', () => {
  const result = claimShareReward({ total: 6, lastDay: '2026-11-06' }, '2026-11-07');
  assert.equal(result.granted, true);
  assert.match(result.message, /last share reward/);
  assert.equal(result.remaining, 0);
});

test('a tampered stored counter cannot buy extra rewards', () => {
  assert.deepEqual(readShareState({ total: -50, lastDay: 7 }), { total: 0, lastDay: '' });
  assert.deepEqual(readShareState({ total: 3.9, lastDay: '2026-11-01' }), { total: 3, lastDay: '2026-11-01' });
  assert.deepEqual(readShareState(null), { total: 0, lastDay: '' });
  // A number too large to be real still refuses rather than wrapping around.
  assert.equal(claimShareReward(readShareState({ total: 1e9 }), '2026-11-09').granted, false);
});

test('the card knows what to say before it is tapped', () => {
  assert.deepEqual(shareAvailability({ total: 0, lastDay: '' }, '2026-11-01'), { canClaim: true, remaining: 7, reason: 'available' });
  assert.deepEqual(shareAvailability({ total: 1, lastDay: '2026-11-01' }, '2026-11-01'), { canClaim: false, remaining: 6, reason: 'claimed-today' });
  assert.deepEqual(shareAvailability({ total: 7, lastDay: '2026-11-07' }, '2026-11-20'), { canClaim: false, remaining: 0, reason: 'all-used' });
});
