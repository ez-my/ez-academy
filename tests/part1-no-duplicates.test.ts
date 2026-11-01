import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PART1_SPEAKING_BANK} from '../src/data/speakingBank';

type Entry = {id: string; topic: string; questions: string[]};

const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

test('no Part 1 question string appears in more than one topic', () => {
  const bank = PART1_SPEAKING_BANK as unknown as Entry[];
  const owners = new Map<string, string[]>();
  for (const entry of bank) {
    for (const q of entry.questions) {
      const key = normalise(q);
      const list = owners.get(key) || [];
      list.push(entry.id);
      owners.set(key, list);
    }
  }
  const duplicates = [...owners.entries()]
    .filter(([, ids]) => new Set(ids).size > 1)
    .map(([q, ids]) => `${q} -> ${[...new Set(ids)].join(', ')}`);
  assert.deepEqual(duplicates, [], `duplicate Part 1 questions across topics:\n${duplicates.join('\n')}`);
});

test('the three previously duplicated questions survive in exactly one topic', () => {
  const bank = PART1_SPEAKING_BANK as unknown as Entry[];
  const targets = [
    'How often do you exercise in a week?',
    'How many siblings do you have?',
    'What do you usually eat for breakfast?',
  ];
  for (const q of targets) {
    const holders = bank.filter(e => e.questions.includes(q)).map(e => e.id);
    assert.equal(holders.length, 1, `${q} should live in exactly one topic, found in ${holders.join(', ') || 'none'}`);
    assert.ok(Number(holders[0].split('_')[1]) <= 111, `${q} should be kept in a pre-existing topic, found ${holders[0]}`);
  }
});

test('pre-existing Part 1 topics are untouched', () => {
  const bank = PART1_SPEAKING_BANK as unknown as Entry[];
  const pre = bank.filter(e => Number(e.id.split('_')[1]) <= 111);
  assert.equal(pre.length, 111, 'the original 111 topics must remain');
  assert.equal(pre.reduce((n, e) => n + e.questions.length, 0), 444, 'the original 444 questions must remain');
});

test('every Part 1 entry still has 3 or 4 questions and unique ids', () => {
  const bank = PART1_SPEAKING_BANK as unknown as Entry[];
  const ids = bank.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'entry ids must be unique');
  for (const e of bank) {
    assert.ok(e.questions.length >= 3 && e.questions.length <= 4, `${e.id} has ${e.questions.length} questions`);
  }
});
