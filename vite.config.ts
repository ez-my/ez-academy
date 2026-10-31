import {assertTrialPaperBuildAuthorized} from './src/server/trialPaperBuildGuard';
import {listeningPreviewPlugin} from './src/server/listeningPreviewPlugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {createHash} from 'node:crypto';
import type {Plugin} from 'vite';
import {defineConfig} from 'vite';

// Keep paper scans out of JavaScript parsing/minification during publication.
// Source papers stay intact; production loads the same images as cached assets.
function readingPaperAssets(): Plugin {
  const emitted = new Set<string>();
  return {
    name: 'reading-paper-assets', apply: 'build', enforce: 'pre',
    buildStart() { assertTrialPaperBuildAuthorized(); emitted.clear(); },
    transform(code, id) {
      if (!/\/readingPapers\/[^/]+\.json$/.test(id)) return;
      const paper = JSON.parse(code);
      const replaceImages = (value: unknown): unknown => {
        if (typeof value === 'string') {
          const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(value);
          if (!match) return value;
          const bytes = Buffer.from(match[2], 'base64');
          const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
          const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
          const fileName = `assets/reading-${hash}.${extension}`;
          if (!emitted.has(fileName)) {
            this.emitFile({type: 'asset', fileName, source: bytes});
            emitted.add(fileName);
          }
          return `/${fileName}`;
        }
        if (Array.isArray(value)) return value.map(replaceImages);
        if (value && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceImages(item)]));
        }
        return value;
      };
      return {code: JSON.stringify(replaceImages(paper)), map: null};
    }
  };
}

export default defineConfig(({mode}) => {
  return {
    plugins: [
      readingPaperAssets(),
      listeningPreviewPlugin(),
      react(), 
      tailwindcss(),

    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // Only packages genuinely needed at boot are pinned to eager chunks.
          // lucide-react, motion and recharts are deliberately absent: naming a
          // barrel package here resolves its index and defeats tree-shaking, so
          // every icon and chart shipped on the marketing pages. Left unlisted,
          // Rollup places them in the lazy route chunks that actually import them.
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true' ? { overlay: false } : false,
    },
  };
});
