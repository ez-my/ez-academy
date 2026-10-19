import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslationHandler } from '../src/server/translation';
import { requestTranslation } from '../src/lib/translation';
import api from '../src/server/netlifyApi';
const migrationApi = (request: Request) => api(request, {} as any);

async function run(options: { token?: string; allowed?: boolean; budget?: boolean; provider?: boolean; body?: unknown; result?: unknown; error?: boolean } = {}) {
  let calls = 0;
  let reservations = 0;
  let reservedUid = '';
  let prompt = '';
  const handler = createTranslationHandler({
    verifyToken: async token => { if (token !== 'valid') throw Error('Invalid'); return { uid: 'existing-uid' }; },
    allowed: uid => uid === 'existing-uid' && options.allowed !== false,
    reserve: async uid => { reservations++; reservedUid = uid; return options.budget !== false; },
    provider: () => options.provider === false ? undefined : {
      json: async (instructions, input) => {
        calls++; prompt = instructions;
        assert.equal(JSON.parse(input).text, 'confidence');
        if (options.error) throw Error('secret-provider-error');
        return options.result ?? { translation: 'keyakinan', definition: 'Belief in your ability.', example: 'Practice builds confidence.', secret: 'must-not-return' };
      },
    },
  });
  const req = new Request('https://preview.example/api/ai/translate', { method: 'POST', headers: { Authorization: options.token ?? 'Bearer valid' }, body: JSON.stringify(Object.hasOwn(options, 'body') ? options.body : { text: 'confidence' }) });
  const response = await handler(req);
  return { status: response.status, body: await response.json(), calls, reservations, reservedUid, prompt };
}

test('translation uses verified existing UID, trusted rubric and bounded response', async () => {
  const result = await run();
  assert.equal(result.status, 200);
  assert.equal(result.reservedUid, 'existing-uid');
  assert.equal(result.reservations, 1);
  assert.equal(result.calls, 1);
  assert.match(result.prompt, /Malaysian English learners/);
  assert.deepEqual(Object.keys(result.body).sort(), ['definition', 'example', 'translation']);
});

test('missing login, invalid login and non-test users never reserve or call AI', async () => {
  for (const options of [{ token: '' }, { token: 'Bearer forged' }, { allowed: false }]) {
    const result = await run(options);
    assert.ok([401, 403].includes(result.status));
    assert.equal(result.calls, 0);
    assert.equal(result.reservations, 0);
  }
});

test('caller cannot select another user, model or system instructions', async () => {
  for (const field of ['uid', 'model', 'systemPrompt']) {
    const result = await run({ body: { text: 'confidence', [field]: 'untrusted' } });
    assert.equal(result.status, 400);
    assert.equal(result.reservations, 0);
  }
});

test('bad input, exhausted budget and missing provider never call AI', async () => {
  for (const body of [null, { text: '' }, { text: [] }, { text: 'x'.repeat(301) }, { text: 'confidence', context: 42 }]) {
    const result = await run({ body });
    assert.equal(result.status, 400); assert.equal(result.calls, 0);
  }
  assert.equal((await run({ budget: false })).status, 429);
  assert.equal((await run({ budget: false })).calls, 0);
  assert.equal((await run({ provider: false })).status, 503);
  assert.equal((await run({ provider: false })).reservations, 0);
});

test('malformed output and provider errors never expose provider details', async () => {
  for (const options of [{ result: {} }, { result: [] }, { result: { translation: 'x', definition: 'y', example: 'z', phonetic: [] } }, { error: true }]) {
    const result = await run(options);
    assert.equal(result.status, 503);
    assert.ok(!JSON.stringify(result.body).includes('secret'));
  }
});

test('browser uses same-origin authenticated endpoint without a provider key', async () => {
  const result = await requestTranslation('confidence', 'Learning English', 'existing-token', async (url, init) => {
    assert.equal(url, '/api/ai/translate');
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer existing-token');
    assert.deepEqual(JSON.parse(String(init?.body)), { text: 'confidence', context: 'Learning English' });
    return Response.json({ translation: 'keyakinan', definition: 'Belief in yourself.', example: 'I have confidence.' });
  });
  assert.equal(result.translation, 'keyakinan');
});

test('Netlify health stays behind release gate and unknown APIs return JSON', async () => {
  const health = await migrationApi(new Request('https://preview.example/api/health'));
  assert.equal((await health.json()).readyForCutover, false);
  for (const path of ['/api/not-real', '/.netlify/functions/api/not-real']) {
    const response = await migrationApi(new Request('https://preview.example' + path));
    assert.equal(response.status, 404);
    assert.equal((await response.json()).code, 'not_found');
  }
  assert.equal((await migrationApi(new Request('https://preview.example/api/ai/translate', { method: 'POST' }))).status, 401);
});

test('paused payments reject checkout, receipts, callbacks and admin mutations before database writes', async () => {
  for (const path of ['/api/checkout', '/api/payment/manual/initiate', '/api/payment/manual/submit-receipt', '/api/payment/reconcile', '/api/tx/callback', '/api/admin/payments/review']) {
    const response = await migrationApi(new Request('https://preview.example' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'PAYMENTS_UNDER_CONSTRUCTION');
  }
});
