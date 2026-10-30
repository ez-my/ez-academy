# Reading / Listening trial-paper rights hold — historical local handoff

> **Superseded access decision (26 October 2026):** the user has since attested that current inventoried use/redistribution is approved, with original assets/labels unchanged. See `REACTIVATION.md` for the implemented narrow allowlist, current verification and deployment warning. The inventory, findings and old verification artifacts below are preserved as historical evidence; they do not describe the new build's access policy.

## Outcome (not deployed)

The trial libraries are blocked pending rights verification, not cosmetically de-labelled. No crop, blur, white overlay, redacted PDF, or replacement exam content was produced. All original source assets and confidentiality labels are preserved. No production deployment, sharing change, cache purge, credential access or commit was performed.

The hold covers **51 Reading sets and 40 Listening sets**, including OCR/readable questions, scans/figures/zoom, original-paper links/downloads, answer-key previews and linked recordings. This is deliberately broader than pages with OCR-detected labels: no set has documented permission to use/redistribute located in the inspected project records.

## Evidence / exact scope

- `AFFECTED_ASSETS.md`: every exposed original question/answer source ID and exact physical source page range; label-positive pages listed separately.
- `inventory.json`: all 91 catalogue records; every local image's app part/page, image hash and OCR label coordinates; every original document's source ID, hash, format, page count and per-page text/OCR findings; 66 original repository file hashes for preservation checks.
- Local Reading JSONs contain **675 image instances / 670 distinct per-set page numbers** (five page numbers recur across part assignments). All 675 images were OCR-inspected; 446 images across 34 sets contain 698 SULIT/TERHAD observations. OCR is evidence, not perfect detection and not a rights decision.
- Retrieved all **129 exposed original document references** into private scratch, not public or deploy directories: **127 PDFs / 1,093 physical PDF pages**, one JPEG answer sheet and one DOCX. Every PDF page and the JPEG were rendered/OCR-inspected (1,094 page images); the DOCX's XML parts were inspected separately. DOCX pagination is renderer-dependent, so no fixed page count is asserted; the entire DOCX is held. All local snapshot pages are separately enumerated.
- Format discoveries: Reading `sabah-lahad-datu-2026` original Drive ID `18ZwZBJYY-iDPOq2PoOSE1vJIz9-FdOYG` is DOCX, not PDF; Listening `negeri-sembilan` answer ID `1MOon5Et5FbPnq1_X64wqfezqRZ9nsThf` is JPEG. Private scratch download filenames use `.pdf` but `format`/`status` identify true formats. No source format was converted or overwritten remotely.
- Representative primary evidence: Kuala Lumpur Reading original/snapshot page 2 has SULIT at header and footer, plus `© 2026 Hak Cipta MPSM Kuala Lumpur`; Kuala Lumpur Listening cover page 1 has the same markings and copyright owner/date, and describes `MODUL TOP 5 KUALA LUMPUR 2026`. These do not prove an ongoing legal classification, but certainly do not establish redistribution permission or authorize hiding labels.
- Provenance: `trialReadingTests.ts` says the catalogue came from supplied Drive folders; `trialListeningTests.ts` describes the supplied 2026 trial bank and names the source folder. No grant/release/license record was found in project README, docs, catalogue files or relevant source. Neither a public Drive URL nor a trial date establishes authorization. No external legal conclusion is asserted.

## Root cause and safe implementation

Reading loaded base64 scans, text and figures through `import.meta.glob` JSON chunks, with full-page modal zoom and direct Drive original links. Listening rendered imported OCR parts or a Drive iframe, with direct question/key/audio links and Express/Netlify audio proxies. Its existing `cleanPaperText` stripped some SULIT/TERHAD OCR strings while the original image/iframe still showed them. Changing CSS/one page would miss other positions and downloads.

The route imports now use an accessible responsive rights-hold notice. The original libraries and all source data remain untouched but are disconnected from the production frontend module graph. The policy defaults deny every ID, including future additions. Both audio implementations return 451 with `private, no-store` before contacting Drive. Trial check endpoints likewise return 451 after authentication but before reading history, grading, writing usage or disclosing answer-key results. Synthetic transport/grading tests explicitly inject authorization; no URL, request field or environment setting can enable it in production.

The notice links only to the existing dashboard. It does not route users into another unverified bank or claim that substitute materials have been authorized. Existing learner history and drafts were not changed. Reinstating material requires per-asset release/redistribution evidence and a reviewed allowlist/display implementation, not simply changing a global boolean.

## Verification

- Test-first regressions were observed failing: audio returned 200 rather than 451; original UI imports were still present; grading attempted database access and returned 503 rather than the rights hold. The implemented guards make these pass.
- `npm run lint`: exit 0 (`tsc --noEmit`).
- `npm run build:netlify`: exit 0; packaged Netlify runtime check passed.
- `npm run build`: exit 0; frontend, Netlify runtime check and Node server bundle succeeded. `build-output.txt` contains the execution output. Existing large-chunk and mixed static/dynamic analytics import warnings remain.
- `npm test`: **254 passed, 0 failed, 0 skipped**, including deny-default audio/check tests, catalogue and future-ID policy tests, original-file SHA-256 preservation and production-bundle checks for every trial Drive ID and every embedded scan payload. `test-output.txt` records the full run.
- `git diff --check`: exit 0 for this change set/worktree.
- Six browser renders of the real notice component with built app CSS: Reading/Listening at widths 1440, 390 and 320. No horizontal overflow, JavaScript errors, original exam images/iframes/audio or download links; keyboard focus reaches the dashboard link. See `render-results.json` and `screenshots/`. Representative mobile/desktop screenshots were also visually inspected for legibility/clipping.
- Render scope is **isolated real-component testing**, not authenticated full-app end-to-end testing. No production claim is made.

## Changed files / rollback

Hand-edited tracked files:
- `src/pages/ReadEZ.tsx`, `src/pages/ListenEZ.tsx`
- `src/server/listeningAudio.ts`, `src/server/practiceRoutes.ts`
- `netlify/functions/listening-audio.ts`
- `tests/listening-audio.test.ts`, `tests/full-migration.test.ts`, `tests/practice-routes.test.ts`

Added:
- `src/components/TrialPaperRightsNotice.tsx`
- `src/lib/trialPaperRights.ts`
- `tests/paper-rights.test.ts`
- `scripts/audit-trial-paper-rights.ts`
- This `docs/paper-rights/` evidence folder, including reproduction helpers and screenshots (no original question papers).

The build also regenerated existing Netlify function bundles and local `dist-web`/`dist` outputs. Some generated bundles and many unrelated source files were already dirty at task start: do **not** blanket-restore or commit the worktree. `rights-hold-tracked.patch` contains only the eight tracked files edited for this task and can be reverse-applied after review; it deliberately excludes pre-existing dirty generated bundles. Remove only the specifically added modules/tests/audit script if intentionally rolling back, then rebuild from the preserved source. Re-enabling unverified content is not recommended.

Private evidence originals and raw OCR intermediates: `/Users/shahril/.hermes/cache/scratch/ez-paper-rights/` (scratch can expire). Durable hashes/findings are in `inventory.json`; copied original PDFs are not in deploy/public output. Reproduction helpers in this folder use this local private scratch path and macOS PDFKit/Vision; they are verification artifacts, not app dependencies.

## Limits / next decision

NADI must independently review the asset/page table, source evidence and browser artifacts. Obtain documented release/redistribution permission from the relevant rights holders before restoring any affected set or producing a de-labelled derivative. No authorization was assumed and no replacement content was ingested.

This local hold does not revoke externally shared Drive files, previously deployed chunks, old deployment URLs, browser downloads or previously cacheable audio. A reviewed deployment and, where appropriate, old-artifact/cache/share cleanup are separate actions requiring approval. No such action was taken.
