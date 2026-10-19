import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackHandler, type FeedbackDependencies } from '../src/server/feedback';
import { requestFeedback, FeedbackError } from '../src/lib/openai';

async function run(options: { auth?: string; body?: any; key?: string; error?: any; content?: string; finishReason?: string; badToken?: boolean } = {}) {
  let calls = 0;
  let received: any;
  const deps: FeedbackDependencies = {
    verifyToken: async token => { if (options.badToken || token !== 'valid') throw Error('Invalid token'); },
    getKey: () => options.key === undefined ? 'server-secret' : options.key,
    complete: async (...args) => { calls++; received = args; if (options.error) throw options.error; return { content: options.content ?? '{"score":80,"feedback":"Use one more example."}', finishReason: options.finishReason ?? 'stop' }; },
  };
  const result = { status: 200, body: null as any, calls: 0, received: null as any };
  const res: any = { status: (n: number) => { result.status = n; return res; }, json: (body: any) => { result.body = body; return res; } };
  const req: any = { get: () => options.auth ?? 'Bearer valid', body: options.body ?? { systemPrompt: 'Assess writing in JSON.', userPrompt: 'My answer.', temperature: 0.4 } };
  await createFeedbackHandler(deps)(req, res);
  return { ...result, calls, received };
}
test('authenticated feedback reaches OpenAI and preserves complete JSON', async () => {
  const result = await run();
  assert.equal(result.status, 200);
  assert.equal(result.calls, 1);
  assert.equal(JSON.parse(result.body.content).score, 80);
  assert.equal(result.received[0], 'server-secret');
  assert.ok(!JSON.stringify(result.body).includes('server-secret'));
});
test('missing or invalid login never calls the paid provider', async () => {
  for (const options of [{ auth: '' }, { badToken: true }]) {
    const result = await run(options);
    assert.equal(result.status, 401); assert.equal(result.calls, 0);
  }
});
test('missing server key is an honest configuration error', async () => {
  const result = await run({ key: '' });
  assert.equal(result.body.code, 'not_configured'); assert.equal(result.calls, 0);
});
test('bad requests cannot consume the key', async () => {
  for (const body of [{ userPrompt: [] }, { userPrompt: ' ' }, { userPrompt: 'ok', temperature: 3 }, { userPrompt: 'x'.repeat(60001) }]) {
    const result = await run({ body }); assert.equal(result.status, 400); assert.equal(result.calls, 0);
  }
});
test('quota, authentication and rate limit errors remain distinct and redact provider details', async () => {
  for (const [error, code, status] of [
    [{ code: 'insufficient_quota', status: 429, message: 'secret key' }, 'billing_unavailable', 503],
    [{ status: 401, message: 'secret key' }, 'provider_auth_failed', 503],
    [{ status: 429, message: 'secret key' }, 'busy', 429],
    [{ status: 500, message: 'secret key' }, 'feedback_unavailable', 503],
  ] as const) {
    const result = await run({ error }); assert.equal(result.body.code, code); assert.equal(result.status, status);
    assert.ok(!JSON.stringify(result.body).includes('secret key'));
    assert.ok(!('content' in result.body));
  }
});
test('empty, broken and truncated responses cannot become scores', async () => {
  for (const options of [{ content: '{}' }, { content: '' }, { content: '[]' }, { content: 'not JSON' }, { finishReason: 'length' }, { finishReason: 'content_filter' }]) {
    const result = await run(options); assert.equal(result.status, 502); assert.ok(!('content' in result.body));
  }
});
test('browser sends login token to server only and consumes returned feedback', async () => {
  const fetcher: any = async (url: string, init: any) => {
    assert.equal(url, '/api/chatgpt'); assert.equal(init.headers.Authorization, 'Bearer user-token');
    assert.ok(!JSON.stringify(init).includes('server-secret'));
    return new Response(JSON.stringify({ content: '{"feedback":"Clear answer."}' }));
  };
  assert.equal(await requestFeedback('JSON rubric', 'Answer', 'user-token', 0.4, fetcher), '{"feedback":"Clear answer."}');
});
test('browser preserves safe server error and never falls back to fabricated feedback', async () => {
  const fetcher: any = async () => new Response(JSON.stringify({ code: 'billing_unavailable', error: 'AI feedback is temporarily unavailable.' }), { status: 503 });
  await assert.rejects(requestFeedback('rubric', 'answer', 'token', 0.4, fetcher), error => error instanceof FeedbackError && error.code === 'billing_unavailable' && error.status === 503);
  await assert.rejects(requestFeedback('rubric', 'answer', '', 0.4, fetcher), /sign in/);
});
test('browser reports malformed success and connection failures', async () => {
  for (const fetcher of [async () => new Response('{}'), async () => { throw Error('Failed to fetch'); }]) {
    await assert.rejects(requestFeedback('rubric', 'answer', 'token', 0.4, fetcher as any), FeedbackError);
  }
});
