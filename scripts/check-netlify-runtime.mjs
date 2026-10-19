import { execFileSync } from 'node:child_process';
// Catch startup failures hidden by a local Node runtime with require(ESM) enabled.
const runtimeEnv = { ...process.env, MIGRATION_MODE: 'staging' };
// Netlify CLI intentionally masks server secrets; this startup check needs none.
delete runtimeEnv.FIREBASE_SERVICE_ACCOUNT_JSON;
delete runtimeEnv.OPENAI_API_KEY;
execFileSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', `
  const {default: api} = await import('./netlify/functions/api.mjs');
  const response = await api(new Request('http://localhost/api/health'), {});
  const health = await response.json();
  if (response.status !== 200 || health.status !== 'healthy') throw new Error('Netlify runtime health check failed');
`], { stdio: 'inherit', env: runtimeEnv });
console.log('Netlify packaged function starts with require(ESM) disabled.');
