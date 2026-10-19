import { WARMUP_VOICE } from '../speakingWarmup';
import { get, set } from 'idb-keyval';

export async function getExaminerVoice(text: string, token: string, signal?: AbortSignal, deps = { read: get, write: set, request: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init) }, warmup = false) {
  const normalized = text.trim().replace(/\s+/g, ' ');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((warmup ? WARMUP_VOICE.version + ':' : 'gpt-4o-mini-tts:marin:v3:') + normalized));
  const key = 'examiner-voice-' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const cached = await Promise.resolve().then(() => deps.read(key)).catch(() => undefined);
  if (cached instanceof Blob && cached.size) return new Response(cached, { headers: { 'Content-Type': 'audio/mpeg' } });
  const response = await deps.request('/api/speakez/voice', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: normalized, warmup }), signal,
  });
  if (!response.ok) return response;
  const blob = await response.blob();
  if (!blob.size || blob.size > 650000) throw new Error('Invalid examiner audio');
  await Promise.resolve().then(() => deps.write(key, blob)).catch(() => {});
  return new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } });
}
