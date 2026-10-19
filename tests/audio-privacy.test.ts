import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pcmWave, transcribeLocalAudio } from '../src/lib/localAudioProcessing';
import { withoutRecordingData } from '../src/lib/recordingPrivacy';
import { createTaskProvider, runWithProvider, transcribeAudio } from '../src/server/providerContext';
import { getExaminerVoice } from '../src/lib/examinerVoice';

test('device WAV segments preserve speech samples and fit server request limits', () => {
  const wave = pcmWave([new Float32Array([-1, 0, 1])], 0, 3);
  const view = new DataView(wave.buffer);
  assert.equal(new TextDecoder().decode(wave.slice(0, 4)), 'RIFF');
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getInt16(44, true), -32768);
  assert.equal(view.getInt16(48, true), 32767);
  assert.ok(Math.ceil((44 + 16000 * 60 * 2) / 3) * 4 < 4 * 1024 * 1024);
});

test('large files are transcribed in bounded requests without a cloud-storage upload', async () => {
  const old = (globalThis as any).OfflineAudioContext;
  const samples = new Float32Array(16000 * 61).fill(0.2);
  (globalThis as any).OfflineAudioContext = class {
    async decodeAudioData() { return { numberOfChannels: 1, sampleRate: 16000, length: samples.length, getChannelData: () => samples }; }
  };
  try {
    const lengths: number[] = [];
    const text = await transcribeLocalAudio('AAAA', async (data, mime) => {
      assert.equal(mime, 'audio/wav'); lengths.push(data.length); return `Segment ${lengths.length}`;
    });
    assert.equal(text, 'Segment 1\nSegment 2');
    assert.equal(lengths.length, 2);
    assert.ok(lengths.every(length => length < 4 * 1024 * 1024));
  } finally { (globalThis as any).OfflineAudioContext = old; }
});

test('recording data cannot enter synced results, while learning data is retained', () => {
  const original = { id: 'session', transcript: 'My answer', score: 80, metrics: { fluency: 4 }, audioUrl: 'blob:device', nested: { audioBase64: 'AAAA', duration: 12 }, attachments: [new Blob(['private']), 'data:audio/wav;base64,AAAA'] };
  const clean = withoutRecordingData(original);
  assert.deepEqual(clean, { id: 'session', transcript: 'My answer', score: 80, metrics: { fluency: 4 }, nested: { duration: 12 }, attachments: [] });
  assert.equal(original.audioUrl, 'blob:device');
});

test('stateless transcription forwards supported audio without storing it', async () => {
  let calls = 0;
  const provider = createTaskProvider({ OPENAI_API_KEY: 'server-secret' }, () => ({ audio: { transcriptions: { create: async (body: any) => {
    calls++; assert.equal(body.file.name, 'recording.wav'); return { text: 'A learner answer.' };
  } } } }));
  const result = await runWithProvider(provider, () => transcribeAudio(Buffer.from('fixture').toString('base64'), 'audio/wav'));
  assert.equal(result, 'A learner answer.'); assert.equal(calls, 1);
  await assert.rejects(runWithProvider(provider, () => transcribeAudio('AAAA', 'text/plain')));
});

test('examiner audio is reused from device storage without another server request', async () => {
  const recordings = new Map<string, Blob>();
  let requests = 0;
  const deps: any = {
    read: async (key: string) => recordings.get(key),
    write: async (key: string, blob: Blob) => recordings.set(key, blob),
    request: async () => { requests++; return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/mpeg' } }); },
  };
  assert.equal((await (await getExaminerVoice('Hello examiner.', 'token', undefined, deps)).blob()).size, 3);
  assert.equal((await (await getExaminerVoice('  Hello   examiner. ', 'token', undefined, deps)).blob()).size, 3);
  assert.equal(requests, 1);
  assert.equal(recordings.size, 1);
});


test('device voice still plays when IndexedDB is unavailable, using an unbound fetch call', async () => {
  const oldFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async function(this: unknown) {
    assert.equal(this, undefined);
    requests++;
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/mpeg' } });
  };
  try {
    const response = await getExaminerVoice('Cache-unavailable examiner test.', 'token');
    assert.equal(response.status, 200);
    assert.equal((await response.blob()).size, 3);
    assert.equal(requests, 1);
  } finally { globalThis.fetch = oldFetch; }
});
