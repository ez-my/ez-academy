import type { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { TRIAL_LISTENING_TESTS } from '../data/trialListeningTests';

const audioFiles = new Map(TRIAL_LISTENING_TESTS.map(test => [test.id, test.audioFileId]));

export function validAudioRange(range: string) {
  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return false;
  const start = match[1] ? Number(match[1]) : null;
  const end = match[2] ? Number(match[2]) : null;
  return (start === null || Number.isSafeInteger(start)) && (end === null || Number.isSafeInteger(end)) &&
    !(start === null && end === 0) && (start === null || end === null || start <= end);
}

// Stream only the public recordings already listed in the shared test bank.
// Forward byte ranges so large MP3/WAV files can start and seek without a full download.
export function createListeningAudioHandler(fetcher: typeof fetch = fetch) {
  return async (req: Request, res: Response) => {
    const fileId = audioFiles.get(String(req.params.testId));
    if (!fileId) return res.status(404).json({ error: 'This recording was not found.' });
    const range = req.get('range');
    if (range && !validAudioRange(range)) return res.status(416).end();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    req.once('aborted', cancel);
    res.once('close', cancel);
    const timeout = setTimeout(cancel, 25000);
    try {
      const upstream = await fetcher(`https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`, {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: range ? { Range: range } : {},
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (upstream.status === 416) {
        const contentRange = upstream.headers.get('content-range');
        if (contentRange) res.setHeader('Content-Range', contentRange);
        await upstream.body?.cancel();
        return res.status(416).end();
      }
      const type = upstream.headers.get('content-type') || '';
      if (!upstream.ok || (!type.startsWith('audio/') && !type.startsWith('application/octet-stream'))) {
        console.warn('[Listening audio] Source unavailable', upstream.status, type);
        await upstream.body?.cancel();
        return res.status(502).json({ error: 'The recording could not load. Please try again or open the original audio.' });
      }
      res.status(upstream.status);
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      for (const header of ['content-length', 'content-range', 'accept-ranges']) {
        const value = upstream.headers.get(header);
        if (value) res.setHeader(header, value);
      }
      if (req.method === 'HEAD') { await upstream.body?.cancel(); return res.end(); }
      if (!upstream.body) throw new Error('No audio body');
      await pipeline(Readable.fromWeb(upstream.body as any), res);
    } catch (error) {
      if (!controller.signal.aborted) console.warn('[Listening audio] Connection failed', error instanceof Error ? error.message : 'Unknown network error');
      if (!res.headersSent && !res.destroyed) res.status(502).json({ error: 'Audio could not connect. Please try again.' });
      else if (!res.destroyed) res.destroy();
    } finally {
      clearTimeout(timeout);
      req.off('aborted', cancel);
      res.off('close', cancel);
    }
  };
}
