import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';
import { Element } from 'html-element';
globalThis.HTMLElement = Element;

const isProd = process.env['NODE_ENV'] === 'production';
const distFolder = process.env['BUILD_DIR'] || 'dist/phlame';
const html = async () => await readFile(isProd ? `${distFolder}/index.html` : 'index.html', 'utf8');

const app = new Hono()
  .use('/assets/*', serveStatic({ root: isProd ? `${distFolder}/` : './' })) // path must end with '/'
  .get('/sum', (c) => c.html('<h1>Sum sum</h1>'));

const { createRoutes } = await import('./routes');
createRoutes(app);

if (isProd) {
  const index = await html();
  app.get('/*', (c) => c.html(index));
} else {
  app.get('/*', async (c) => c.html(await html()));
}
export default app;

if (isProd) {
  serve({ ...app, port: 4000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
