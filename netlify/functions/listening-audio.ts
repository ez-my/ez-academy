import { TRIAL_LISTENING_TESTS } from '../../src/data/trialListeningTests';
import { validAudioRange } from '../../src/server/listeningAudio';

export const AUDIO_RESPONSE_BYTES = 2 * 1024 * 1024;
export function boundedAudioRange(range: string | null) {
  if (range && !validAudioRange(range)) return null;
  const [, from, to] = (range || 'bytes=0-').match(/^bytes=(\d*)-(\d*)$/)!;
  if (!from) return `bytes=-${Math.min(Number(to), AUDIO_RESPONSE_BYTES)}`;
  const start = Number(from);
  return `bytes=${start}-${Math.min(to ? Number(to) : Number.MAX_SAFE_INTEGER, start + AUDIO_RESPONSE_BYTES - 1)}`;
}
export function createNetlifyListeningAudio(fetcher: typeof fetch = fetch) {
  return async (req: Request) => {
    if (!['GET', 'HEAD'].includes(req.method)) return new Response(null, { status: 405 });
    const testId = new URL(req.url).pathname.split('/').pop();
    const source = TRIAL_LISTENING_TESTS.find(test => test.id === testId);
    if (!source) return Response.json({ error: 'This recording was not found.' }, { status: 404 });
    const range = boundedAudioRange(req.headers.get('range'));
    if (!range) return new Response(null, { status: 416 });
    // Keep playback same-origin, preserving the original player and avoiding
    // Drive's cross-origin restrictions. Bound each GET response below function
    // limits; the media player requests subsequent ranges and supports seeking.
    try {
      const upstream = await fetcher(`https://drive.usercontent.google.com/download?id=${source.audioFileId}&export=download&confirm=t`, {
        method: req.method, headers: req.method === 'HEAD' ? {} : { Range: range }, signal: AbortSignal.timeout(25000),
      });
      const headers = new Headers({ 'Cache-Control': 'public, max-age=3600', 'Accept-Ranges': 'bytes' });
      for (const key of ['content-type', 'content-length', 'content-range']) {
        const value = upstream.headers.get(key); if (value) headers.set(key, value);
      }
      if (upstream.status === 416) { await upstream.body?.cancel(); return new Response(null, { status: 416, headers }); }
      const type = upstream.headers.get('content-type') || '';
      const length = Number(upstream.headers.get('content-length'));
      if (!upstream.ok || !/^(audio\/|application\/octet-stream)/.test(type) || (req.method !== 'HEAD' && (!length || length > AUDIO_RESPONSE_BYTES || upstream.status !== 206))) {
        await upstream.body?.cancel(); return Response.json({ error: 'The recording is temporarily unavailable.' }, { status: 502 });
      }
      return new Response(req.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
    } catch { return Response.json({ error: 'The recording is temporarily unavailable.' }, { status: 502 }); }
  };
}
export default createNetlifyListeningAudio();
