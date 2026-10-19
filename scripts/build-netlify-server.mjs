import { build } from 'esbuild';
import { createRequire, isBuiltin } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const resolve = createRequire(import.meta.url);
// Bundle Firebase's CJS -> ESM bridge. Lambda disables require(ESM), so
// shipping jwks-rsa's raw require('jose') breaks before a handler can run.
// Other SDK dependencies stay external and are traced by Netlify.
for (const [entry,name] of [['netlifyApi','api'],['ops-background','ops-background'],['ops-scheduler','ops-scheduler'],['marketing-background','marketing-background']]) {
await build({
  entryPoints: [`src/server/${entry}.ts`], outfile: `netlify/functions/${name}.mjs`,
  bundle: true, platform: 'node', format: 'esm', target: 'node22', packages: 'external',
  banner: { js: "import { createRequire as moduleRequire } from 'node:module'; const require = moduleRequire(import.meta.url);" },
  plugins: [{ name: 'firebase-module-compatibility', setup(builder) {
    builder.onResolve({ filter: /^(firebase-admin(?:\/.*)?|jwks-rsa|jose|lru-cache)$/ }, args => ({ path: resolve.resolve(args.path, { paths: [args.resolveDir] }) }));
  } }],
});

// Netlify's file tracer cannot infer esbuild's __require helper. Literal
// imports ensure every external SDK dependency is included in the package.
const output = await readFile(`netlify/functions/${name}.mjs`, 'utf8');
const dependencies = [...new Set([...output.matchAll(/__require\("([^" ]+)"\)/g)].map(match => match[1]))].filter(name => !isBuiltin(name));
await writeFile(`netlify/functions/${name}.mjs`, dependencies.map(name => `import '${name}';`).join('\n') + '\n' + output + '\n' + dependencies.map(name => `require('${name}');`).join('\n'));

}
