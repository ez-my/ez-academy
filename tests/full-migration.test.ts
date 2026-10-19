import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createTaskProvider, runWithProvider, analyzeFeedbackWithChatGPT } from '../src/server/providerContext';
import { validateTask, taskRegistry } from '../src/server/taskRegistry';
import { registerTaskRoutes } from '../src/server/taskRoutes';
import { reserveAIRequest } from '../src/server/aiBudget';
import listeningAudio, { createNetlifyListeningAudio, AUDIO_RESPONSE_BYTES } from '../netlify/functions/listening-audio';
import { TRIAL_LISTENING_TESTS } from '../src/data/trialListeningTests';

test('task boundary rejects generic prompts, identity overrides and invalid enums', () => {
  assert.equal(Object.keys(taskRegistry).length, 24);
  for (const name of ['constructor', '__proto__', 'spm.generateJSONWithAI', 'getGenAI']) assert.equal(validateTask(name, []), undefined);
  for (const args of [['Invalid', 'Theme'], ['Article', { systemPrompt: 'override' }], ['Article', 'Theme', 'Invalid']]) assert.equal(validateTask('spm.generateSPMPart3Task', args), undefined);
  assert.ok(validateTask('spm.generateSPMPart3Task', ['Article', 'Environment', 'Full']));
  assert.equal(validateTask('spm.analyzeSPMEmail', [{ context: 'X', apiKey: 'untrusted' }, 'Answer']), undefined);
});

test('provider preserves JSON, text and audio contracts with server-owned models', async () => {
  const calls: any[] = [];
  const client = {
    chat: { completions: { create: async (body: any) => { calls.push(body); return { choices: [{ finish_reason: 'stop', message: { content: body.response_format ? '{"translation":"keyakinan","definition":"Belief","example":"Practice builds confidence."}' : 'I improved with EZ Academy!' } }] }; } } },
    audio: {
      transcriptions: { create: async (body: any) => { calls.push(body); assert.equal(body.file.name, 'recording.wav'); return { text: 'A learner talks about school.' }; } },
      speech: { create: async (body: any) => { calls.push(body); return new Response(new Uint8Array([0, 0, 1, 0])); } },
    },
  };
  const provider = createTaskProvider({ OPENAI_API_KEY: 'server-secret', OPENAI_TEXT_MODEL: 'configured-model' }, () => client);
  assert.equal(JSON.parse(await provider.feedback('Original rubric', 'Answer')).translation, 'keyakinan');
  assert.equal(calls[0].model, 'configured-model');
  assert.match(calls[0].messages[0].content, /Original rubric/);
  const generated = await provider.generateContent({ model: 'ignored-client-model', contents: 'Caption', config: {} });
  assert.equal(generated.text, 'I improved with EZ Academy!');
  assert.equal(calls[1].model, 'configured-model');
  const questions = await provider.generateContent({ contents: [{ parts: [{ inlineData: { data: Buffer.from('RIFF WAV fixture').toString('base64'), mimeType: 'audio/wav' } }] }], config: { systemInstruction: 'Generate listening questions', responseMimeType: 'application/json' } });
  assert.ok(questions.text);
  assert.match(calls[3].messages[1].content, /A learner talks about school/);
  const voice = await provider.generateContent({ contents: [{ parts: [{ text: 'Welcome.' }] }], config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } });
  assert.equal(voice.candidates?.[0].content.parts[0].inlineData.mimeType, 'audio/pcm;rate=24000');
  assert.equal(calls[4].voice, 'nova');
  assert.equal(calls[4].response_format, 'pcm');
  assert.ok(!JSON.stringify(generated).includes('server-secret'));
});

test('parallel student requests never share provider context', async () => {
  const provider = (name: string) => ({ feedback: async () => name, generateContent: async () => ({ text: name }) });
  const results = await Promise.all(['student-a', 'student-b'].map(name => runWithProvider(provider(name), async () => { await Promise.resolve(); return analyzeFeedbackWithChatGPT('rubric', 'answer'); })));
  assert.deepEqual(results, ['student-a', 'student-b']);
});

test('authenticated task route executes original rubric and rejects untrusted callers before spending', async () => {
  let reserves = 0, calls = 0;
  let decision = 'allowed';
  const app = express(); app.use(express.json());
  registerTaskRoutes(app, null as any, {
    verify: async token => { if (token !== 'valid') throw Error('Invalid'); return { uid: 'existing-user' }; },
    allowed: uid => uid === 'existing-user',
    reserve: async uid => { assert.equal(uid, 'existing-user'); reserves++; return decision; },
    provider: () => ({ feedback: async () => '{}', generateContent: async request => { calls++; assert.match(request.config.systemInstruction, /SPM Writing/); return { text: '{"theme":"Reading","friendName":"Ali","friendEmail":"ali@example.com","subject":"Books","situation":"Suggest a book","emailBody":"Hi, which book? Bye for now!"}' }; } }),
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/ai/task`;
  const request = (body: any, token = 'valid') => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-EZ-Request-ID': randomUUID() }, body: JSON.stringify(body) });
  try {
    const response = await request({ task: 'spm.generateSPMEmailTask', args: ['Reading'] });
    assert.equal(response.status, 200); assert.equal((await response.json()).result.practiceMode, 'Full');
    assert.equal(calls, 1); assert.equal(reserves, 1);
    assert.equal((await request({ task: 'spm.generateSPMEmailTask', args: [] }, 'forged')).status, 401);
    assert.equal((await request({ task: 'spm.generateSPMEmailTask', args: [], uid: 'another-user' })).status, 400);
    assert.equal((await request({ task: 'spm.generateJSONWithAI', args: ['custom rubric'] })).status, 400);
    assert.equal(calls, 1); assert.equal(reserves, 1);
    decision = 'quota'; assert.equal((await request({ task: 'spm.generateSPMEmailTask', args: [] })).status, 429);
    decision = 'duplicate'; assert.equal((await request({ task: 'spm.generateSPMEmailTask', args: [] })).status, 409);
    assert.equal(calls, 1);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('persistent request budget handles concurrent duplicates and keeps profiles unchanged', async () => {
  const records = new Map<string, any>([['users/learner', { plan: 'free', credits: 3 }]]);
  let chain = Promise.resolve();
  const database: any = {
    doc: (path: string) => ({ path, collection: (name: string) => ({ doc: (id: string) => database.doc(path + '/' + name + '/' + id) }) }),
    runTransaction: (action: any) => {
      const pending = chain.then(async () => {
        const writes: Array<[string, any]> = [];
        const result = await action({ get: async (ref: any) => ({ exists: records.has(ref.path), data: () => records.get(ref.path) }), set: (ref: any, value: any) => writes.push([ref.path, value]), create: (ref: any, value: any) => writes.push([ref.path, value]) });
        for (const [path, value] of writes) records.set(path, { ...records.get(path), ...value });
        return result;
      });
      chain = pending.then(() => undefined);
      return pending;
    },
  };
  const id = randomUUID(); const env = { AI_REQUESTS_PER_USER_DAILY: '1', AI_REQUESTS_GLOBAL_DAILY: '2' };
  const results = await Promise.all([reserveAIRequest(database, 'learner', id, 'task', env), reserveAIRequest(database, 'learner', id, 'task', env)]);
  assert.deepEqual(results.sort(), ['allowed', 'duplicate']);
  assert.equal(await reserveAIRequest(database, 'learner', randomUUID(), 'task', env), 'quota');
  assert.deepEqual(records.get('users/learner'), { plan: 'free', credits: 3 });
  assert.equal(await reserveAIRequest(database, 'missing', randomUUID(), 'task', env), 'no_profile');
});

test('Netlify listening audio preserves public source and seeking without an arbitrary URL proxy', async () => {
  const test = TRIAL_LISTENING_TESTS[0];
  const proxy = createNetlifyListeningAudio((async (url, options) => {
    assert.ok(String(url).includes(test.audioFileId));
    assert.equal((options?.headers as any).Range, `bytes=200-${200 + AUDIO_RESPONSE_BYTES - 1}`);
    return new Response('audio', { status: 206, headers: { 'content-type': 'audio/mpeg', 'content-length': '5', 'content-range': 'bytes 200-204/70000000', 'cross-origin-resource-policy': 'same-site' } });
  }) as typeof fetch);
  const response = await proxy(new Request('https://preview.example/api/listening/audio/' + test.id, { headers: { Range: 'bytes=200-' } }));
  assert.equal(response.status, 206); assert.equal(await response.text(), 'audio');
  assert.equal(response.headers.get('content-range'), 'bytes 200-204/70000000');
  assert.equal(response.headers.get('cross-origin-resource-policy'), null);
  const oversized = createNetlifyListeningAudio((async () => new Response('x', { headers: { 'content-type': 'audio/mpeg', 'content-length': '70000000' } })) as typeof fetch);
  assert.equal((await oversized(new Request('https://preview.example/api/listening/audio/' + test.id))).status, 502);
  assert.equal((await listeningAudio(new Request('https://preview.example/api/listening/audio/' + test.id, { headers: { Range: 'bytes=invalid' } }))).status, 416);
  assert.equal((await listeningAudio(new Request('https://preview.example/api/listening/audio/unknown'))).status, 404);
});


test('SPM writing rubrics request the exact level and check symbols consumed by the original UI', async () => {
  const { analyzeSPMEmail } = await import('../src/server/tasks/spm');
  let prompt = '';
  const result = await runWithProvider({
    generateContent: async () => { throw new Error('Unexpected generation'); },
    feedback: async (instructions) => {
      prompt = instructions;
      return JSON.stringify({ marks: { content: 5, commAchievement: 5, organisation: 5, language: 5, total: 20 }, level: 'Excellent', bulletCheck: [{ question: 'Answer all questions', status: '✅', comment: 'Covered' }], feedback: { strengths: ['Clear'], improvements: [] } });
    },
  }, () => analyzeSPMEmail({ situation: 'Reply to a friend', emailBody: 'What should I do?' } as any, 'Here is my advice.'));
  assert.match(prompt, /Excellent \(Band 5\)/);
  assert.match(prompt, /exact Unicode character ✅/);
  assert.ok(!prompt.includes('âœ'));
  assert.equal(result.level, 'Excellent');
  assert.equal(result.bulletCheck[0].status, '✅');
  assert.equal(result.score, 100);
});
