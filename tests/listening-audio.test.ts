import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createListeningAudioHandler, validAudioRange } from '../src/server/listeningAudio';

async function withServer(fetcher: typeof fetch, action: (base: string) => Promise<void>) {
  const app = express();
  // Synthetic transport fixtures only; production defaults remain fail-closed.
  app.get('/api/listening/audio/:testId', createListeningAudioHandler(fetcher, () => true));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  try { await action(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

test('single byte ranges support playback and seeking, malformed/multiple ranges are rejected', () => {
  for (const value of ['bytes=0-', 'bytes=1000-2023', 'bytes=-1024', 'bytes=0-0']) assert.ok(validAudioRange(value), value);
  for (const value of ['bytes=-', 'bytes=-0', 'bytes=20-10', 'bytes=0-1,2-3', 'bytes=999999999999999999999-', 'items=0-4']) assert.ok(!validAudioRange(value), value);
});
test('native MP3 player gets a streamed partial response with byte headers', async () => {
  const chunk = Buffer.from('ID3-test-audio');
  await withServer((async (url, init) => {
    assert.equal(String(url), 'https://drive.usercontent.google.com/download?id=1dhlAhlbOcaM3fb-lUc4O7Byhf81Oan9f&export=download&confirm=t');
    assert.equal((init!.headers as any).Range, 'bytes=0-13');
    return new Response(chunk, { status: 206, headers: { 'content-type': 'audio/mpeg', 'content-length': String(chunk.length), 'content-range': `bytes 0-${chunk.length - 1}/71547188`, 'accept-ranges': 'bytes' } });
  }) as typeof fetch, async base => {
    const response = await fetch(base + '/api/listening/audio/kuala-lumpur', { headers: { Range: 'bytes=0-13' } });
    assert.equal(response.status, 206); assert.equal(response.headers.get('content-type'), 'audio/mpeg');
    assert.equal(response.headers.get('content-range'), `bytes 0-${chunk.length - 1}/71547188`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), chunk);
  });
});
test('WAV audio and HEAD metadata are supported without converting or downloading the whole file', async () => {
  await withServer((async (_url, init) => new Response(init!.method === 'HEAD' ? null : 'RIFF-test-audio', { headers: { 'content-type': 'audio/wav', 'accept-ranges': 'bytes' } })) as typeof fetch, async base => {
    const response = await fetch(base + '/api/listening/audio/kedah');
    assert.equal(response.status, 200); assert.equal(await response.text(), 'RIFF-test-audio');
    const head = await fetch(base + '/api/listening/audio/kedah', { method: 'HEAD' });
    assert.equal(head.status, 200); assert.equal(head.headers.get('content-type'), 'audio/wav'); assert.equal(await head.text(), '');
  });
});
test('unknown test and malformed range cannot fetch arbitrary external files', async () => {
  let calls = 0;
  await withServer((async () => { calls++; throw Error('Unexpected fetch'); }) as typeof fetch, async base => {
    assert.equal((await fetch(base + '/api/listening/audio/unknown-file')).status, 404);
    assert.equal((await fetch(base + '/api/listening/audio/kedah', { headers: { Range: 'bytes=20-10' } })).status, 416);
    assert.equal(calls, 0);
  });
});
test('Google login/error HTML is never served as an audio file', async () => {
  for (const status of [200, 403, 429]) {
    await withServer((async () => new Response('<html>Unable to load</html>', { status, headers: { 'content-type': 'text/html' } })) as typeof fetch, async base => {
      const response = await fetch(base + '/api/listening/audio/kedah');
      assert.equal(response.status, 502); assert.match((await response.json()).error, /could not load/);
      assert.ok(!response.headers.get('cache-control'));
    });
  }
});
test('upstream range errors preserve total size for the native player', async () => {
  await withServer((async () => new Response(null, { status: 416, headers: { 'content-range': 'bytes */100' } })) as typeof fetch, async base => {
    const response = await fetch(base + '/api/listening/audio/kedah', { headers: { Range: 'bytes=1000-' } });
    assert.equal(response.status, 416); assert.equal(response.headers.get('content-range'), 'bytes */100');
  });
});
test('network failures show a retryable audio error', async () => {
  await withServer((async () => { throw Error('Network failed'); }) as typeof fetch, async base => {
    const response = await fetch(base + '/api/listening/audio/kedah');
    assert.equal(response.status, 502); assert.match((await response.json()).error, /try again/);
  });
});
