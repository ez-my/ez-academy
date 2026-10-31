// Dev-only config for the local UI preview harness. Production builds use
// vite.config.ts; this one is never referenced by `npm run build`.
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Redirect the app's Firebase and API modules to inert stubs, so a page can be
// mounted without credentials, network calls or a signed-in user.
function previewStubs(): Plugin {
  const stub = (name: string) => path.resolve(__dirname, 'preview/stubs', name);
  return {
    name: 'preview-stubs',
    enforce: 'pre',
    resolveId(source) {
      if (/(^|\/)lib\/firebase$/.test(source)) return stub('firebase.ts');
      if (/(^|\/)lib\/practice$/.test(source)) return stub('practice.ts');
      if (/(^|\/)lib\/limits$/.test(source)) return stub('practice.ts');
      if (/(^|\/)lib\/affiliate$/.test(source)) return stub('affiliate.ts');
      if (source === 'firebase/firestore' || source === 'firebase/auth' || source === 'firebase/app') return stub('firebase.ts');
      return null;
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [previewStubs(), react(), tailwindcss()],
  server: { port: 5190, host: '127.0.0.1', open: false },
  // Without this Vite scans every index.html in the repo, including dist-web.
  optimizeDeps: { entries: ['preview/index.html'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
