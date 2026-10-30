import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { normalizeSpeakingBankQuestion } from '../src/lib/speakingTaskCompatibility';
import { runWithProvider } from '../src/server/providerContext';
import { generateSPMSpeakingTask } from '../src/server/tasks/spm';
import { PART2_SPEAKING_BANK, PART3_SPEAKING_BANK } from '../src/data/speakingBank';
import { SPEAKING_PART2_BANK, SPEAKING_PART3_BANK } from '../src/data/speakingQuestionBank';
import { renderSpeakEZ, renderedText } from './helpers/speakezUiHarness';

// SYNTHETIC fixtures only. Firestore is replaced in memory; no SDK/network is loaded.
const nestedPart2 = { part: 2, introduction: 'Synthetic introduction.', promptCard: { topic: 'A synthetic memorable trip', prompts: ['Where?', 'With whom?', 'Why?'], prepTip: 'Give details.' } };
async function loadBank(data: any) {
  const source = readFileSync(new URL('../src/services/questionBankService.ts', import.meta.url), 'utf8');
  const exports: any = {};
  const firestore = {
    collection: () => ({}), query: () => ({}), where: () => ({}), limit: () => ({}),
    getDocs: async () => ({ docs: [{ id: 'synthetic-question', data: () => ({ type: 'Speaking', part: 2, data }) }] }),
  };
  const require = (name: string) => {
    if (name === '../lib/speakingTaskCompatibility') return { normalizeSpeakingBankQuestion };
    if (name === 'firebase/firestore') return firestore;
    if (name === '../lib/firebase') return { db: {} };
    if (name === '../lib/recordingPrivacy') return { withoutRecordingData: (x: any) => x };
    if (name === '../lib/readTestCompatibility') return {};
    throw Error(`Unexpected module: ${name}`);
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require, console });
  return exports;
}
test('synthetic saved nested Part 2 card survives a bank round trip into the flat bank contract', async () => {
  const bank = await loadBank(nestedPart2);
  const result = await bank.getRandomQuestion('Speaking', 2);
  assert.equal(result.topic, nestedPart2.promptCard.topic);
  assert.deepEqual(Array.from(result.prompts), nestedPart2.promptCard.prompts);
  assert.equal(result.prepTip, 'Give details.');
  assert.equal(result.id, 'synthetic-question');
});
test('synthetic full-test Part 2 renders the same topic and points as standalone Part 2', () => {
  for (const selectedPart of [2, 'Full']) {
    const text = renderedText(renderSpeakEZ({ view: 'recording', selectedPart, currentFullPart: 2, task: nestedPart2 }));
    assert.ok(text.includes(nestedPart2.promptCard.topic), text);
    for (const point of nestedPart2.promptCard.prompts) assert.ok(text.includes(point), `missing ${point}`);
  }
});
test('synthetic Part 2 preparation shows a nested-only generated topic', () => {
  const text = renderedText(renderSpeakEZ({ view: 'preparation', selectedPart: 2, task: nestedPart2 }));
  assert.ok(text.includes(nestedPart2.promptCard.topic), text);
});
test('synthetic incomplete AI task uses labelled sample questions rather than an empty Part 2 card', async () => {
  const result = await runWithProvider({ feedback: async () => { throw Error('unexpected'); }, generateContent: async () => ({ text: '{}' }) }, () => generateSPMSpeakingTask(2));
  assert.equal(result.fallback, true);
  assert.ok(result.promptCard?.topic);
  assert.ok(result.promptCard?.prompts.length);
});
test('all checked-in flat speaking cards preserve the actual topic and prompts under normalization', () => {
  for (const [part, bank] of [[2, [...PART2_SPEAKING_BANK, ...SPEAKING_PART2_BANK]], [3, [...PART3_SPEAKING_BANK, ...SPEAKING_PART3_BANK]]] as const) {
    for (const original of bank) {
      const normalized = normalizeSpeakingBankQuestion(original, part);
      assert.ok(normalized, original.id); assert.equal(normalized.topic, original.topic);
      assert.deepEqual(part === 2 ? normalized.promptCard.prompts : normalized.discussion.points, original.prompts);
      assert.equal(part === 2 ? normalized.promptCard.topic : normalized.discussion.situation, original.topic);
    }
  }
});
test('synthetic nested Part 3 retains its decision question and full-test display', () => {
  const normalized = normalizeSpeakingBankQuestion({ discussion: { situation: 'Synthetic discussion', points: ['Synthetic point'], decisionQuestion: 'Synthetic decision?', hotQuestion: 'Synthetic follow-up?' } }, 3);
  const text = renderedText(renderSpeakEZ({ view: 'recording', selectedPart: 'Full', currentFullPart: 3, task: normalized, part3Step: 2 }));
  assert.ok(text.includes('Synthetic discussion')); assert.ok(text.includes('Synthetic decision?'));
});
test('synthetic malformed bank cards fail closed instead of displaying empty quotation marks', async () => {
  for (const bad of [{}, { topic: 'Missing prompts' }, { theme: 'Theme is not a speaking task', prompts: ['Why?'] }]) {
    assert.equal(normalizeSpeakingBankQuestion(bad, 2), null);
    const bank = await loadBank(bad); assert.equal(await bank.getRandomQuestion('Speaking', 2), null);
  }
});
