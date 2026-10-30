# Autosave deployment incident — live rolled back and healthy

Autosave implementation passed independent acceptance; parent full suite/TypeScript passed (335 fixture tests in accepted suite). No authenticated production student save test was performed.

## Verified current state
Netlify site: 857e98b0-3919-48a3-8aa7-897dfee1d265, app.ez-academy.my.
Published deployment restored to 6ade9849209494545c59dd0c. Parent GET /api/health after rollback returned HTTP200 healthy, migrationMode production, readyForCutover true, timestamp2026-10-26T19:58:34.383Z.
Autosave release is NOT currently live. No student records deliberately altered, paid model calls or account creation during verification.

## Failed releases and recovery
1. Candidate6adfaa4a7e7b30d90a9668be / production6adfad9a2b8c1378677ee737: new frontend lazy chunks byte-matched reviewed build. API502 cannot find google-auth-library. Uploaded API651570bytes; standalone dependency omission due isolated node_modules symlink tracing. Restored old deploy and verified HTTP200.
2. Dependency-complete prebuilt ZIP preview6adfb07908cb0db11d80e5a0 / production6adfb0b9a7d07af3b4039f8c: APIZIP5324187bytes,1732entries,includesGoogle auth/Firestore. Extracted ZIP default-handler startup succeeds without host NODE_PATH and with require(ESM)disabled. Netlify preview's available_functions SHA256 digests and sizes match all six local ZIPs. However live runtime502 error decoding lambda response, invalid NUL after top-level value. Restored old deployment again; HTTP200 verified.

## Packaging evidence
- Accepted build-source: /Users/shahril/.hermes/cache/scratch/ez-progress-cloud-order-fixes/build-source
- Original node_modules symlink preserved as node_modules.shared-link; actual dependency tree copied locally, original repository untouched.
- .netlify/functions-real contains dependency-complete ZIPs.
- Extracted API runtime test: /Users/shahril/.hermes/cache/scratch/ez-progress-lambda-check-real
- Preview/permalink URLs protected with HTTP401; do not disable or bypass access protection.
- Hypothesis for independent investigation: prebuilt ZIP deploy lost modern v2/streaming metadata. Not yet established; compare available_functions.bd.runtimeAPIVersion and im with old working deployment.
- Correct next check may be direct source-functions deploy with real dependencies, PREVIEW ONLY, preserving modern function metadata. Do not attempt another production release without independent package/runtime evidence.

## Active independent investigation
Delegation deleg_38cd448f has preview-only packaging scope. No production deploy/promote/rollback/site-setting changes authorised to that child. Expected evidence /Users/shahril/.hermes/cache/scratch/ez-progress-deploy-packaging/.

Do not report autosave fixed live until a successful release is read back and live API/static checks pass. Authenticated task-save E2E must still be labelled unverified until actually exercised.

## Packaging repair independently verified; authentication blocker remains
Independent preview: 6adfb2477ffbcbf6a841eb8e. Parent readback verified all six available_functions have runtime API2 with correct stream/background modes. API ZIP SHA256 d85e283ca2261ac9bd4a3975e9a6e1b1955c758268d9969cecdbacd40830fc93, bytes5324245. Root causes: symlink dependency omission plus raw-ZIP metadata loss/content-addressed reuse. Corrected packaging uses archive comments (no extracted file changes) and manifest-provided runtime metadata; exact reproduction in scratch/ez-progress-deploy-packaging/README.md. Parent reran actual extracted API entry/bootstrap under Node22 with AWS framing: HTTP200healthy,zero outbound attempts. Evidence parent-runtime-verification.json. This is offline bootstrap verification, NOT hosted Lambda.
Latest public production health200; protected preview health401. No further production release after rollback. Browser lacks signed-in preview access; vault has no saved login. Await authorised preview authentication for hosted check; do not bypass or disable protection. Current live published deploy remains6ade9849209494545c59dd0c. Autosave not live.
