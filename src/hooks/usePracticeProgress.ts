import { useEffect, useMemo, useState } from 'react';
import { auth, saveSession } from '../lib/firebase';
import { PracticeAttempt } from '../lib/practiceAttempt';
import type { PracticeSession } from '../types';

export function usePracticeProgress(uid: string | undefined, type: PracticeSession['type']) {
  const [, refresh] = useState(0);
  const attempt = useMemo(() => {
    if (!uid) return null;
    let storage: Pick<Storage, 'getItem' | 'setItem'>;
    try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Device storage unavailable'); } }; }
    return new PracticeAttempt(uid, type, storage, saveSession, () => auth.currentUser?.uid);
  }, [uid, type]);
  const update = () => refresh(value => value + 1);
  const complete = async (fields: Partial<PracticeSession>) => {
    if (!attempt) return false;
    const saving = attempt.complete(fields); update();
    const result = await saving; update(); return result;
  };
  const retry = async () => {
    if (!attempt) return;
    const saving = attempt.retry(); update(); await saving; update();
  };
  useEffect(() => {
    // One bounded retry per mount/reconnect, never a render-driven write loop.
    let retries = 0;
    const reconnect = () => { if (attempt?.hasPending && retries++ < 2) void retry(); };
    const changed = (event?: StorageEvent) => {
      if (event?.key && !event.key.startsWith(`ez-progress-v2:${encodeURIComponent(uid || '')}:${type}:`) && event.key !== `ez-progress-v1:${uid}:${type}`) return;
      update(); reconnect();
    };
    reconnect(); window.addEventListener('online', reconnect);
    window.addEventListener('storage', changed);
    return () => { window.removeEventListener('online', reconnect); window.removeEventListener('storage', changed); };
  }, [attempt]);
  return { attempt, complete, retry, update };
}

export function usePracticeDraft(progress: ReturnType<typeof usePracticeProgress>, draft: any) {
  const latest = useMemo(() => ({ value: draft }), [progress.attempt]);
  latest.value = draft;
  useEffect(() => {
    const attempt = progress.attempt;
    if (!attempt) return;
    const timer = setTimeout(() => { attempt.writeDraft(latest.value); progress.update(); }, 600);
    return () => clearTimeout(timer);
  }, [progress.attempt, JSON.stringify(draft)]);
  useEffect(() => {
    const attempt = progress.attempt;
    if (!attempt) return;
    const flush = () => attempt.writeDraft(latest.value);
    window.addEventListener('pagehide', flush);
    return () => { flush(); window.removeEventListener('pagehide', flush); };
  }, [progress.attempt]);
}
