import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as spm from '../src/server/tasks/spm';
import * as muet from '../src/server/tasks/muet';
import { runWithProvider } from '../src/server/providerContext';

// Exercise the preserved server rubrics without any live provider or student data.
const task: any = { context: 'Tell a friend about reading.', theme: 'Reading', practiceMode: 'Full', bulletPoints: ['Why read?'], title: 'Reading' };
const transcript = 'I read a short story every weekend because it helps me learn new words and share ideas with friends.';
const topic: any = { id: 'reading', title: 'Reading', part1: { situation: 'Students want to read more.', tasks: { A: 'Talk about stories.', B: 'Talk about libraries.', C: 'Talk about online reading.', D: 'Talk about teachers.' } }, part2: { situation: 'Discuss reading.', centralQuestion: 'How can students read more?', points: ['Stories', 'Libraries'], decisionPrompt: 'Choose a way.' } };
const cases = [
  ['speaking', () => spm.analyzeSPMSpeaking(1, task, transcript, { aiEngine: 'gemini' })],
  ['email', () => spm.analyzeSPMEmail(task, transcript, { aiEngine: 'gemini' })],
  ['guided writing', () => spm.analyzeSPMPart2(task, transcript)],
  ['extended writing', () => spm.analyzeSPMPart3(task, transcript, 'Article')],
  ['full essay', () => spm.analyzeSPMFullEssay(task, transcript)],
  ['general feedback', () => spm.analyzeSpeech(transcript, 'English')],
  ['transcript evaluator', () => spm.evaluateSpeechTranscript(transcript)],
  ['MUET Part 1', () => muet.analyzeMUETPart1(topic, 'A', transcript, 60, '')],
  ['MUET Part 2', () => muet.analyzeMUETPart2(topic, 'A', [transcript], [], 60)],
] as const;

async function withResponse(response: (body: any) => Response, action: () => Promise<any>) {
  return runWithProvider({
    feedback: async (systemPrompt, userPrompt) => {
      const result = response({ systemPrompt, userPrompt });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error);
      return body.content;
    },
    generateContent: async () => { throw new Error('Unexpected generation'); },
  }, action);
}

test('every assessment rejects failed OpenAI calls instead of estimating marks', async () => {
  for (const [name, action] of cases) {
    await assert.rejects(withResponse(() => new Response(JSON.stringify({ code: 'billing_unavailable', error: 'AI feedback is temporarily unavailable. Your answer was not scored.' }), { status: 503 }), action), /temporarily unavailable/, name);
  }
});
test('every assessment rejects incomplete feedback instead of saving zero/default marks', async () => {
  for (const [name, action] of cases) {
    await assert.rejects(withResponse(() => new Response(JSON.stringify({ content: '{"message":"incomplete"}' })), action), /incomplete/, name);
  }
});
test('SPM writing keeps zero marks and computes totals from actual rubric values', async () => {
  for (const [, action] of cases.slice(1, 5)) {
    const result = await withResponse(() => new Response(JSON.stringify({ content: JSON.stringify({ marks: { content: 0, commAchievement: 3, organisation: 2, language: 4, total: 99 }, feedback: { strengths: ['Clear examples'], improvements: ['Answer the question'] } }) })), action);
    assert.equal(result.marks.total, 9); assert.equal(result.score, 45);
  }
});
test('SPM speaking ignores a conflicting model percentage and uses the 24-mark rubric', async () => {
  const result = await withResponse(() => new Response(JSON.stringify({ content: JSON.stringify({ marks: { grammar: 3, vocabulary: 4, communicativeCompetence: 2, overallPerformance: 3, total: 99 }, score: 99, feedback: 'Clear ideas. Add an example.' }) })), cases[0][1]);
  assert.equal(result.marks.total, 12); assert.equal(result.score, 50);
});

test('MUET Part 1 and Part 2 validate real report fields and exclude AI peer speech', async () => {
  const report: any = { overallBandEstimate: 'Band 4.0', bandScoreNumber: 4, strengths: ['Clear ideas'], actionableSteps: ['Add one example'] };
  for (const key of ['taskFulfilment','fluencyAndCoherence','languageAndGrammar','interactionAndCommunicativeCompetence']) report[key] = { score: 4, maxScore: 5, cefrLevel: 'B2', observations: ['Clear ideas'], suggestions: ['Add an example'] };
  const peer: any = { id: 'peer', speaker: 'B', text: 'Private AI peer content that must not be scored', isAI: true };
  const result = await withResponse(body => {
    assert.ok(!body.userPrompt.includes(peer.text));
    return new Response(JSON.stringify({ content: JSON.stringify(report) }));
  }, () => muet.analyzeMUETPart2(topic, 'A', [transcript], [peer], 60));
  assert.equal(result.rawTranscript, transcript);
  assert.equal(result.bandScoreNumber, 4);
  const solo = await withResponse(() => new Response(JSON.stringify({ content: JSON.stringify(report) })), cases[7][1]);
  assert.equal(solo.testType, 'Part1'); assert.equal(solo.rawTranscript, transcript);
});
