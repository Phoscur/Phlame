import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';
import './html.element.server';
import { GameRenderer } from './render.server';
import { defaultLang, useTranslations } from './app/i18n';

const isProd = process.env['NODE_ENV'] === 'production';
const distFolder = process.env['BUILD_DIR'] || 'dist/phlame';
const html = async () => await readFile(isProd ? `${distFolder}/index.html` : 'index.html', 'utf8');

const app = new Hono()
  .use('/assets/*', serveStatic({ root: isProd ? `${distFolder}/` : './' })) // path must end with '/'
  .get('/sum', (c) => c.html('<h1>Sum sum</h1>'));

const { createRoutes } = await import('./routes');
createRoutes(app);

const t = useTranslations(defaultLang);

if (isProd) {
  const index = await html();
  const game = new GameRenderer(index, 'Production Phlame', defaultLang);
  app.get('/*', (c) => c.html(game.render()));
} else {
  app.get('/*', async (c) =>
    c.html(new GameRenderer(await html(), 'JIT Phlame', defaultLang).render()),
  );
}
export default app;

if (isProd) {
  serve({ ...app, port: 4000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
