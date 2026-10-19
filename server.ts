import express from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { createApplication } from './src/server/application';

dotenv.config();
async function startServer() {
  const app = createApplication();
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true, hmr: process.env.DISABLE_HMR === 'true' ? false : undefined }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist-web');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  app.listen(port, '127.0.0.1', () => console.log(`EZ Academy preview: http://127.0.0.1:${port}`));
}
startServer().catch(() => { console.error('The application could not start. Check server configuration.'); process.exitCode = 1; });
