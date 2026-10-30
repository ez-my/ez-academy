# Autosave release checkpoint — acceptance blocked

Task: Sir requested TEKNO fix automatic task/progress saving for free and paid users.

## Verified by parent
- Local source /Users/shahril/Projects/ez-academy.
- Most recent parent full suite: 302 passed, 0 failed; npm run lint exit0.
- Parent isolated production build succeeded at /Users/shahril/.hermes/cache/scratch/ez-progress-release-candidate; packaged Netlify startup check passed. Large-chunk warning remains.
- No production deployment performed. No production learner writes, paid model calls or account creation during this task.

## Final independent review BLOCKER
Review delegation deleg_361d7db7 reproduced a cross-remount race with actual WriteEZ handler and shared memory storage (synthetic cloud/model boundaries): pending assessment A from an unmounted route can replace draft B and its unsynced completion after a new route mount.
Parent source check confirms:
- src/lib/practiceAttempt.ts:15 uses one storage key ez-progress-v1:<uid>:<type>.
- retain():26-27 overwrites that key with instance-owned draft/pending/acknowledged state, no revision or ownership check.
- usePracticeProgress.ts:8-13 constructs a new independent PracticeAttempt per mount.
Two fix/re-review cycles already completed. Do not stack another patch without discussing persistence architecture with Sir.

## Approved architecture correction (implemented locally; review pending)
Sir approved “Yup do whats necessary” after the cross-remount blocker was explained. The v2 implementation separates immutable per-attempt result versions/acknowledgements from writer-owned active draft slots. Frozen ownership epochs prevent stale pagehide/unmount writers from displacing a newer remount. The namespace is enumerated rather than indexed through a racy shared read-modify-write object. Legacy unsynced results are copied without deleting their source. See `docs/autosave-storage-v2.md` for protocol, concurrency reasoning, compatibility, tests and explicit limits.

New artifacts: `/Users/shahril/.hermes/cache/scratch/ez-progress-storage-redesign/` (pre-change snapshot/hash manifest, raw RED/GREEN logs, final verification, focused/cumulative patches and a separate isolated build). The old parent build below is not the new release candidate. Acceptance still requires independent parent review.

## Artifacts
- Original preserved dirty baselines: /Users/shahril/.hermes/cache/scratch/ez-progress-baseline/
- First fixes: /Users/shahril/.hermes/cache/scratch/ez-progress-review-fixes/
- Current cumulative patch/tests: /Users/shahril/.hermes/cache/scratch/ez-progress-final-fixes/cumulative-autosave-task.patch
- Current release build (NOT accepted for deployment): /Users/shahril/.hermes/cache/scratch/ez-progress-release-candidate/
- Review transcript: /Users/shahril/.hermes/cache/delegation/live/deleg_361d7db7/task-0.log

Existing failures addressed: scenario change while AI pending; Finish erases pending score; repeated same Reading attempt ID; model called for conflicting pending answer; delayed feedback replaces current draft within one mount.

Status: locally implemented and tested, NOT accepted, NOT deployed. Authenticated live end-to-end and deployed Firebase rules behavior remain unverified.
