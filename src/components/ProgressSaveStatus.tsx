import type { usePracticeProgress } from '../hooks/usePracticeProgress';
export function ProgressSaveStatus({ progress }: { progress: ReturnType<typeof usePracticeProgress> }) {
  const attempt = progress.attempt;
  if (!attempt) return <p role="status">Sign in to save progress.</p>;
  return <div className="text-sm text-white/65 space-y-2" role="status">
    <p>{attempt.status === 'saving' ? 'Saving progress…' : attempt.status === 'saved' ? 'Saved to your account. Score is separate from completion.' : attempt.status === 'not-synced' ? 'Not synced. This completion is not confirmed in your account.' : 'Draft only — not completed.'}</p>
    <p>{attempt.localDurable ? 'Text drafts stay on this device. Recordings are never uploaded with progress.' : 'Device storage is unavailable. Keep this page open; unsynced text is only in memory.'}</p>
    {attempt.hasPending && attempt.status !== 'not-synced' && <p>Earlier completed work is not synced yet. Retrying does not assess your current draft.</p>}
    {attempt.draftConflict && <p>A newer draft is active in another page. This page's text is retained separately; reopen practice to continue the latest draft.</p>}
    {attempt.hasPending && <button type="button" className="min-h-11 underline" onClick={() => void progress.retry()}>Retry sync (no AI call)</button>}
  </div>;
}
