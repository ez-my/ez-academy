import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayStart,reportTasks} from '../src/server/dailyReport';

const AT = dayStart('2026-11-01');

test('a malformed legacy part does not throw and does not lose the valid parts', () => {
  // Reproduced against the pre-fix implementation:
  // TypeError: Cannot read properties of null (reading 'part') at dailyReport.ts:11
  const session: any = {
    id: 's2', userId: 'u1', type: 'ReadEZ', testSetId: 't2', timestamp: AT,
    readingResult: {parts: {1: null, 2: {part: 2, correct: 3, total: 10}}},
  };
  const rows = reportTasks([session], []);
  assert.equal(rows.length, 1, 'only the valid part is recorded');
  assert.equal(rows[0].score, 30);
});

test('non-object garbage in parts is skipped rather than crashing', () => {
  const session: any = {
    id: 's3', userId: 'u1', type: 'ListenEZ', testSetId: 't3', timestamp: AT,
    listeningResult: {parts: {1: 'nonsense', 2: undefined, 3: {part: 3, correct: 5, total: 5}}},
  };
  const rows = reportTasks([session], []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].score, 100);
});

test('valid sessions are unaffected by the guard', () => {
  const session: any = {
    id: 's4', userId: 'u1', type: 'ReadEZ', testSetId: 't4', timestamp: AT,
    readingResult: {parts: {1: {part: 1, correct: 8, total: 10}, 2: {part: 2, correct: 8, total: 10}}},
  };
  const rows = reportTasks([session], []);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(r => r.score).sort(), [80, 80]);
});
