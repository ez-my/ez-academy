# SpeakEZ local marking and Part 2 audit

## Scope and verification boundary

Local source and synthetic regression fixtures only. No deployment, commits, live AI calls, production queries or production record modifications were performed. The working tree already contained unrelated edits; those were left intact. `AGENTS.md` was absent at the requested project root and no ancestor guidance file was found. Loaded TEKNO, systematic-debugging, test-driven-development and requesting-code-review skills.

The supplied screenshot `/Users/shahril/.hermes/cache/images/img_55dcbcb96b34.jpg` was accessible: recording at about 0:17, Part 2 heading, an empty quoted topic, no visible task points, and the live-transcription placeholder. It contains no explicit error message. It does not establish which question source or application build was used.

## Findings and confirmed fixes

1. **Generated/bank question shape mismatch.** `saveQuestionToBank` stores generated speaking tasks with nested `promptCard`/`discussion`. `getRandomQuestion` previously returned these unchanged, while SpeakEZ reconstructed them from flat `topic`, `theme`, `prompts` and question fields. A valid nested-only Part 2 fixture therefore lost its topic and points. This reproduces the screenshot's blank-card symptom locally, but does not prove the screenshot's exact record. Added a shared compatibility normalizer, used on bank reads and generated tasks. Page now retains the canonical nested card rather than rebuilding it from a curriculum theme. Invalid cards return null or use the existing explicitly labelled sample-question fallback; no sample marks are generated.
2. **Full-test rendering conditions.** Recording UI checked `selectedPart === 2/3`; during a full test the selection is `'Full'`, so the points/discussion were omitted. It now renders using the effective current part. Preparation also falls back to the nested card's topic.
3. **Final transcription discarded on Pause/Finish.** The recorder disabled result acceptance and cleared its recognizer before Web Speech's asynchronous final event. Synthetic replay returned only `I visited` rather than the complete final sentence. It now accepts events from the same recognizer until `onend`, with a 1.5-second bound; stale/reset-session events remain excluded. Review waits for both the audio blob and transcription settlement. Resume waits for the previous recognizer rather than overwriting it. A fresh recording clears an earlier audio blob.
4. **Stored transcript could be rewritten by the model.** The assessment returned the model's `transcript` verbatim; the Save handler persisted that value. The server now always returns the learner-confirmed input as the transcript audit record.
5. **Conflicting short-answer instruction.** Warm-up instructions accepted short natural replies but another mandate forced all bands to zero under ten words. Removed that arbitrary word-count rule; scoring still uses the same rubric and must state evidence limitations. Empty/punctuation-only/no-response input is rejected server-side before any provider call, rather than relying on a model instruction to produce zero.

Each changed defect had a failing regression run before its corresponding fix. Tests for the first bank failure observed `undefined` versus the expected nested topic; rendering failures observed missing points/title; recorder failures observed truncated text; assessment tests observed rewritten speech and acceptance of empty answers; prompt-contract test observed the contradictory ten-word rule.

## End-to-end trace and same-mark investigation

- **Capture:** `src/hooks/useAudioRecorder.ts`: getUserMedia -> gain node -> MediaRecorder blob for local replay/storage; independent browser SpeechRecognition supplies transcript text. Microphone sensitivity affects the recorded Web Audio stream, not the recognizer's independently obtained input. Browser support/network/permissions can prevent transcription even while audio recording succeeds.
- **Confirmed input:** SpeakEZ review text -> `handleAnalyze` -> `src/lib/gemini.ts` -> `invokeTask('spm.analyzeSPMSpeaking', [part, task, transcript, config])`. The audio blob and delivery/prosody are NOT submitted by this assessment path. The UI already discloses transcript-only evaluation. No server transcription fallback is invoked by this particular page.
- **Transport/access:** `src/lib/aiTask.ts` sends authenticated same-origin POST with a fresh request UUID. `src/server/taskRoutes.ts` validates task arguments, paid access and reservations, sets `Cache-Control: no-store`, and runs the request-scoped provider. Duplicate reservation returns 409, not a reused score. Free access uses general feedback, not a personalised mark.
- **Provider/rubric:** `src/server/tasks/spm.ts` -> `generateJSONWithAI` -> `providerContext.feedback` -> OpenAI chat completion. Despite legacy Gemini model names and `aiEngine` parameters in task code, this route's actual provider is OpenAI; the default text model in `providerContext.ts` is `gpt-4o-mini` unless server configuration overrides it. No environment values were inspected or printed. The four bands are grammar, vocabulary, communicative competence and overall performance, each 0–6. The prompt explicitly says text cannot establish pronunciation, pauses, pace or vocal clarity, although some oral-band descriptors still reference those qualities. This is a rubric-validity limitation requiring educational review, not proof of acoustic assessment.
- **Parsing/score:** `checkMarks` requires finite numeric bands in range and nonempty feedback, recomputes total, and speaking recomputes `Math.round(total / 24 * 100)`. Invalid marks reject; failed/incomplete provider calls do not receive a default passing mark. Legacy zero fallbacks below validation cannot replace missing valid bands on this path. No score clamping or assessment-answer cache was found. Equal sums legitimately produce equal percentages, including different profiles of component bands; whole-number bands also give a coarse scale.
- **Display/store:** SpeakEZ displays `feedback.score` directly, passes the same score/metrics/feedback/transcript to `saveSession`, and writes the same analysis score to question-completion tracking. `saveSession` stores under the authenticated user's session path and strips recording data via `withoutRecordingData`. Audio stays device-local. No database schema or stored records were changed in this audit.

Synthetic plumbing fixtures returned bands of 5 and 2 for clearly labelled stronger/weaker text, producing displayed and memory-saved scores **83, 33, 83** across three fresh calls. These outputs were deliberately supplied by a fake provider: they prove forwarding, lack of local answer-cache reuse, parsing/display/save consistency and repeat handling, **not** that a live model distinguishes strong and weak performances. No identity-based score differentiation was introduced or expected.

## Exact verification commands/results

All project commands ran in `/Users/shahril/Projects/ez-academy`.

- Baseline: `node --import tsx --test tests/feedback-assessment.test.ts tests/speaking-warmup.test.ts` -> **9 passed, 0 failed**; baseline `npm run lint` -> exit 0.
- Individual red/green loops: `node --import tsx --test tests/speakez-bank.test.ts`, `node --import tsx --test tests/speakez-recorder.test.ts`, and `node --import tsx --test tests/speakez-assessment.test.ts`.
- Final targeted: `node --import tsx --test tests/speakez-*.test.ts` -> **16 passed, 0 failed**. Warning about using sample questions is expected from the explicit incomplete-generation fixture.
- Final complete suite: `npm test` -> **249 passed, 0 failed, 0 skipped**, exit 0. Full output: `/Users/shahril/.hermes/cache/scratch/speakez-audit-tests.log`. Existing negative payment/audio fixtures log expected errors while passing.
- `npm run lint` -> `tsc --noEmit`, exit 0.
- `git diff --check` -> exit 0, no output.
- `node ./node_modules/vite/bin/vite.js build --outDir /Users/shahril/.hermes/cache/scratch/speakez-audit-build --emptyOutDir` -> **3889 modules transformed; built in 8.86s**, exit 0. Existing-style analytics mixed-import and large-chunk warnings remain. Full build output: `/Users/shahril/.hermes/cache/terminal-output/out-1792689688-27358-be10.log`.
- The equivalent initial `npx vite build ...` was blocked by the terminal tool's long-lived-process classifier; invoking the installed Vite CLI with Node succeeded. No dependency installation was needed.
- Added production-line static scan: hardcoded-secret, dynamic-eval, shell-injection and unsafe-HTML patterns -> **0 matches**. Test VM harnesses intentionally execute only checked-in source and replace all external service imports.

The UI tests are text-only executions of the real TSX with controlled hook state and inert effects/imports. Recorder tests replay browser API events. They are not an authenticated browser run, Windows microphone test, real layout test, or live provider verification. The frontend build was directed to scratch to avoid rebuilding/overwriting the pre-existing dirty Netlify bundles.

## Files changed

Modified:
- `src/hooks/useAudioRecorder.ts`
- `src/pages/SpeakEZ.tsx`
- `src/server/tasks/spm.ts`
- `src/services/questionBankService.ts`

Created:
- `src/lib/speakingTaskCompatibility.ts`
- `tests/speakez-assessment.test.ts`
- `tests/speakez-bank.test.ts`
- `tests/speakez-recorder.test.ts`
- `tests/helpers/speakezUiHarness.ts`
- `docs/SPEAKEZ_LOCAL_AUDIT.md`

Scratch artifacts: frontend build, test log, and tool-captured build output at the paths above.

## Remaining blockers / next verification

- The actual cause of the reported equal live marks is **not established** without the affected confirmed transcripts, task cards, component bands, provider response and deployed build identity. None were invented or read from production.
- No physical Windows/browser audio run or authenticated live AI assessment was performed. Independent NADI verification and a consented staging/manual test should precede any release claim.
- This flow cannot distinguish two deliveries whose confirmed text is the same; it does not measure pronunciation, confidence or prosody. Do not promise full speaking-ability grading or change scores based on speaker identity.
- The retained oral descriptors and coarse aggregate require educational/calibration review with anonymised, consented examples if grading validity remains the concern. Adding acoustic assessment is a separate product/privacy/cost decision, not a patch made here.
- No deployment, staging release, commit or production-data repair is included.
