import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSPMSpeaking } from '../src/server/tasks/spm';
import { runWithProvider, type TaskProvider } from '../src/server/providerContext';
import { renderSpeakEZ, renderedText, findButton } from './helpers/speakezUiHarness';

// SYNTHETIC fixture responses test plumbing, NOT AI grading accuracy or calibration.
const task = { part: 2 as const, promptCard: { topic: 'A synthetic trip', prompts: ['Where?', 'Why?'] } };
const answer = 'Although the synthetic museum was crowded, I enjoyed learning how traditional boats were built because the guide explained every stage clearly.';
const response = { marks: { grammar: 5, vocabulary: 5, communicativeCompetence: 4, overallPerformance: 5, total: 24 }, score: 100, feedback: 'SYNTHETIC feedback: clear explanation.', transcript: 'A fabricated polished answer not spoken by the learner.' };
const provider: TaskProvider = { feedback: async () => JSON.stringify(response), generateContent: async () => { throw Error('Unexpected generation'); } };
test('synthetic assessment preserves the confirmed input instead of saving model-rewritten speech', async () => {
  const result = await runWithProvider(provider, () => analyzeSPMSpeaking(2, task, answer));
  assert.equal(result.transcript, answer);
  assert.equal(result.marks.total, 19);
  assert.equal(result.score, 79);
});
test('empty synthetic answers are rejected before a provider can invent passing marks', async () => {
  let calls = 0;
  const counting = { ...provider, feedback: async () => { calls++; return JSON.stringify(response); } };
  for (const empty of ['', '... !!!', '(No response captured)']) {
    await assert.rejects(runWithProvider(counting, () => analyzeSPMSpeaking(2, task, empty)), /not scored|No answer/i);
  }
  assert.equal(calls, 0);
});
test('short relevant synthetic warm-up answers are not automatically ordered to receive zero', async () => {
  await runWithProvider({ ...provider, feedback: async (instructions) => {
    assert.doesNotMatch(instructions, /under 10 meaningful words/);
    assert.match(instructions, /short relevant natural answers/i);
    return JSON.stringify(response);
  } }, () => analyzeSPMSpeaking(1, { part: 1, questions: ['What do you enjoy?'] }, 'I enjoy reading.'));
});
test('synthetic distinct rubric responses remain distinct through parsing, display and memory-only save', async () => {
  const weaker = 'I go synthetic museum. Boat there. I like boat because boat nice. Family go too.';
  const calls: string[] = [];
  const fixtureProvider = { ...provider, feedback: async (instructions: string, input: string) => {
    calls.push(input);
    assert.match(instructions, /cannot establish pronunciation/);
    const band = input.includes(answer) ? 5 : 2;
    return JSON.stringify({ ...response, marks: { grammar: band, vocabulary: band, communicativeCompetence: band, overallPerformance: band, total: 999 }, score: 77 });
  } };
  const scores: number[] = [];
  for (const transcript of [answer, weaker, answer]) {
    const result = await runWithProvider(fixtureProvider, () => analyzeSPMSpeaking(2, task, transcript));
    scores.push(result.score);
    const saved: any[] = [];
    const tree = renderSpeakEZ({ view: 'feedback', selectedPart: 2, task, feedback: result }, {
      '../hooks/useAudioRecorder': { useAudioRecorder: () => ({ audioBlob: new Blob(['SYNTHETIC AUDIO']), transcript, duration: 1000 }) },
      '../lib/storage': { audioStorage: { saveAudio: async () => {} } },
      '../lib/firebase': { auth: { currentUser: { uid: 'synthetic-memory-only' } }, saveSession: async (_uid: string, payload: any) => { saved.push(payload); } },
      'react-hot-toast': { toast: { success: () => {}, error: () => {} } },
    });
    assert.match(renderedText(tree), new RegExp(`${result.score}  / 100`));
    const button = findButton(tree, 'Save result'); assert.ok(button);
    button.props.onClick(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(saved.length, 1); assert.equal(saved[0].score, result.score); assert.equal(saved[0].transcript, transcript);
  }
  assert.deepEqual(scores, [83, 33, 83]);
  assert.equal(calls.length, 3, 'each request reaches the fixture provider; no answer-cache reuse');
  assert.ok(calls[0].includes(answer)); assert.ok(calls[1].includes(weaker));
});
test('synthetic malformed rubric values reject instead of clamping or falling back to a shared score', async () => {
  for (const grammar of [-1, 7, '5', null]) {
    await assert.rejects(runWithProvider({ ...provider, feedback: async () => JSON.stringify({ ...response, marks: { ...response.marks, grammar } }) }, () => analyzeSPMSpeaking(2, task, answer)), /incomplete/);
  }
});
