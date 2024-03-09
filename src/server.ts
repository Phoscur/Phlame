import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';

const isProd = process.env['NODE_ENV'] === 'production';
const distFolder = process.env['BUILD_DIR'] || 'dist/phlame';
const html = await readFile(isProd ? `${distFolder}/index.html` : 'index.html', 'utf8');

const app = new Hono()
  .use('/assets/*', serveStatic({ root: isProd ? `${distFolder}/` : './' })) // path must end with '/'
  .get('/sum', (c) => c.html('<h1>Sum sum</h1>'))
  .get('/*', (c) => c.html(html));

export default app;

if (isProd) {
  serve({ ...app, port: 4000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
