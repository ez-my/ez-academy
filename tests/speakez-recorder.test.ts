import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// SYNTHETIC Web Speech/MediaRecorder events; no physical microphone or network.
function recorderHarness() {
  const slots: any[] = []; let index = 0;
  const timers = new Map<number, () => void>(); let timerId = 0;
  const recognizers: any[] = []; const recorders: any[] = [];
  const react = {
    useState: (initial: any) => { const n = index++; if (!(n in slots)) slots[n] = initial; return [slots[n], (v: any) => { slots[n] = typeof v === 'function' ? v(slots[n]) : v; }]; },
    useRef: (initial: any) => { const n = index++; return slots[n] ??= { current: initial }; },
    useCallback: (fn: any) => fn, useEffect: () => {},
  };
  class Recognition {
    onresult: any; onend: any; onerror: any;
    constructor() { recognizers.push(this); }
    start() {} stop() {}
    result(text: string, final = true) { const result: any = [{ transcript: text }]; result.isFinal = final; this.onresult({ resultIndex: 0, results: [result] }); }
  }
  class Recorder {
    state = 'inactive'; onstop: any; ondataavailable: any;
    constructor(_stream: any) { recorders.push(this); }
    start() { this.state = 'recording'; }
    pause() { this.state = 'paused'; }
    resume() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; }
    finish() { this.ondataavailable({ data: new Blob(['SYNTHETIC AUDIO']) }); this.onstop(); }
  }
  class Context {
    createMediaStreamSource() { return { connect() {} }; }
    createGain() { return { gain: { value: 1 }, connect() {} }; }
    createMediaStreamDestination() { return { stream: {} }; }
    async close() {}
  }
  const exports: any = {};
  const timeout = (fn: () => void) => { timers.set(++timerId, fn); return timerId; };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/hooks/useAudioRecorder.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, require: () => react, Blob, console, Date, MediaRecorder: Recorder,
    navigator: { onLine: true, mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } },
    window: { SpeechRecognition: Recognition, AudioContext: Context, setInterval: () => 1, setTimeout: timeout },
    setTimeout: timeout, clearTimeout: (id: number) => timers.delete(id), clearInterval() {},
  });
  return { render: () => { index = 0; return exports.useAudioRecorder(); }, recognizers, recorders, timers };
}
test('synthetic final recognition arriving after Finish is retained before review is ready', async () => {
  const h = recorderHarness(); await h.render().startRecording();
  h.recognizers[0].result('I visited', false);
  h.render().stopRecording();
  h.recorders[0].finish();
  const pending = h.render().isTranscribing;
  h.recognizers[0].result('I visited the synthetic museum with my family.');
  h.recognizers[0].onend();
  assert.equal(h.render().transcript, 'I visited the synthetic museum with my family.');
  assert.equal(pending, true, 'review must wait for the final speech result');
  assert.equal(h.render().isTranscribing, false);
});
test('synthetic late recognition from a reset session cannot contaminate the next answer', async () => {
  const h = recorderHarness(); await h.render().startRecording();
  h.render().reset(); await h.render().startRecording();
  h.recognizers[0].result('OLD SYNTHETIC ANSWER');
  h.recognizers[1].result('Fresh synthetic answer.');
  assert.equal(h.render().transcript, 'Fresh synthetic answer.');
});
test('synthetic final recognition after Pause is retained when recording resumes immediately', async () => {
  const h = recorderHarness(); await h.render().startRecording();
  h.recognizers[0].result('First', false);
  h.render().pauseRecording(); h.render().resumeRecording();
  h.recognizers[0].result('First synthetic sentence.'); h.recognizers[0].onend();
  for (const callback of [...h.timers.values()]) callback();
  assert.equal(h.render().transcript, 'First synthetic sentence.');
});
test('synthetic hung speech service cannot block review or accept events beyond its timeout', async () => {
  const h = recorderHarness(); await h.render().startRecording();
  h.recognizers[0].result('Retained synthetic partial', false);
  h.render().stopRecording(); h.recorders[0].finish();
  for (const callback of [...h.timers.values()]) callback();
  assert.equal(h.render().isTranscribing, false);
  h.recognizers[0].result('TOO LATE');
  assert.equal(h.render().transcript, 'Retained synthetic partial');
});
