import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReadTest } from '../src/lib/readTestCompatibility';
import { LOCAL_READING_BANK } from '../src/data/readingBank';

test('split legacy reading passages and questions combine without changing stored content', () => {
  const original = { id: 'bank-id', title: 'Original paper', parts: [
    { partNumber: 1, instruction: 'Read.', stimuli: [{ id: 's1', content: 'Original notice' }] },
    { partNumber: 1, instruction: 'Choose.', questions: [{ id: 'q1', number: 1, type: 'MCQ', text: 'What?', options: ['A. One', 'B. Two', 'C. Three'] }] },
  ], answers: { '1': 'B' } };
  const before = JSON.stringify(original);
  const test = normalizeReadTest(original, 1)!;
  assert.equal(test.parts.length, 1);
  assert.equal(test.parts[0].stimuli![0].content, 'Original notice');
  assert.equal(test.parts[0].questions[0].text, 'What?');
  assert.equal(test.answers.q1, 'B');
  assert.equal(JSON.stringify(original), before);
  assert.equal(normalizeReadTest(original, 1, true), null);
});

test('original short offline reading banks remain usable', () => {
  for (const value of LOCAL_READING_BANK) assert.ok(normalizeReadTest(value));
});

test('incomplete or unscoreable reading responses cannot be saved as valid new tests', () => {
  assert.equal(normalizeReadTest({ parts: [{ partNumber: 1, passage: 'Passage only' }], answers: {} }), null);
  assert.equal(normalizeReadTest({ parts: [{ partNumber: 1, questions: [{ id: 'q1', number: 1, type: 'MCQ', options: ['A', 'B', 'C'] }] }], answers: {} }), null);
});
