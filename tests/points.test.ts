import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POINTS_ON_SIGNUP,
  POINTS_PER_FULL_TEST,
  POINTS_PER_PRACTICE,
  awardPoints,
  pointsForPractice,
} from '../src/points';

test('a practice is worth a fixed amount, a full test more', () => {
  assert.equal(pointsForPractice(), POINTS_PER_PRACTICE);
  assert.equal(pointsForPractice(false), POINTS_PER_PRACTICE);
  assert.equal(pointsForPractice(true), POINTS_PER_FULL_TEST);
  assert.ok(POINTS_PER_FULL_TEST > POINTS_PER_PRACTICE, 'a full test takes longer than one practice');
});

test('awarding adds to the stored total', () => {
  assert.equal(awardPoints(100, 10), 110);
  assert.equal(awardPoints(0, 10), 10);
  assert.equal(awardPoints(1840, 25), 1865);
});

test('a stored total written by the old client cannot corrupt the next award', () => {
  // Points were client-written for the whole life of the app, so anything may
  // be sitting in the field already.
  assert.equal(awardPoints(undefined, 10), 10);
  assert.equal(awardPoints(null, 10), 10);
  assert.equal(awardPoints('bananas', 10), 10);
  assert.equal(awardPoints(-500, 10), 10, 'a negative total is floored rather than carried forward');
  assert.equal(awardPoints(NaN, 10), 10);
  assert.equal(awardPoints(12.7, 10), 22, 'a fractional total is truncated, not rounded up');
});

test('a bad award value cannot subtract or inflate', () => {
  assert.equal(awardPoints(100, -50), 100, 'a negative award leaves the total alone');
  assert.equal(awardPoints(100, NaN), 100);
  assert.equal(awardPoints(100, Infinity), 100);
  assert.equal(awardPoints(100, 0), 100);
});

test('the signup grant matches what the rules allow at creation', () => {
  // firestore.rules caps points at 100 on create. If this constant moves, that
  // cap has to move with it or every new signup is rejected.
  assert.equal(POINTS_ON_SIGNUP, 100);
});

test('points cannot run away within a day under the free allowance', () => {
  // Free is 2 practices a day. Points are awarded per practice the server
  // spends, so a day is bounded no matter how often the client calls.
  let total = POINTS_ON_SIGNUP;
  for (let i = 0; i < 2; i += 1) total = awardPoints(total, pointsForPractice());
  assert.equal(total, 120, 'two free practices is the whole of a free day');
});
