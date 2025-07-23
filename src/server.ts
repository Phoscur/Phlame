import { Hono, Context } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getCookie, setCookie } from 'hono/cookie';
import { readFile } from 'node:fs/promises';
import './html.element.server';
import { defaultLang, Language } from './app/i18n';
import { GameRenderer } from './render.server';
import { EngineService, startup } from './engine.server';
import { StatusCode } from 'hono/utils/http-status';

const isProd = process.env.NODE_ENV === 'production';
const distFolder = process.env.BUILD_DIR ?? 'dist/phlame';
const html = async () => await readFile(isProd ? `${distFolder}/index.html` : 'index.html', 'utf8');

// TODO
// - persist sessions
// - connect htmx-ws

// start Zeitgeber: Game Tick Loop
const engineInjector = await startup();

// TODO? session middleware app.use('/*')
async function sessionHelper(engine: EngineService, ctx: Context) {
  const save = (sid: string, eid: string) => {
    setCookie(ctx, 'sid', sid);
    setCookie(ctx, 'empire', eid);
  };
  const sid = getCookie(ctx, 'sid');
  if (!sid) {
    const session = await engine.generateSession();
    save(session.sid, `${session.empire.id}`); // TODO?! UnitID should be string only...
  } else {
    // const eid = getCookie(c, 'empire');
    await engine.load(sid);
    /*try {    } catch (e) {
      console.error('Failed to load session, generating a new one', e);
      return;
      const session = await engine.generateSession();
      save(session.sid, `${session.empire.id}`);
    }*/
  }
}

const app = new Hono()
  .use('/assets/*', serveStatic({ root: isProd ? `${distFolder}/` : './' })) // path must end with '/'
  .get('/sum', async (c) => {
    const engine = engineInjector.inject(EngineService);
    // const lang = (getCookie(c, 'lang') as Language) || defaultLang;
    const sid = getCookie(c, 'sid');
    if (sid) {
      const code = await engine.load(sid);
      // TODO engine.save
      if (0 !== code) {
        c.status((code >= 200 ? code : 500) as StatusCode);
        return c.html(`<h1>Ouch, Error: ${code}</h1>`);
      }
      // TODO engine.update&save()
      // but it's actually not worth updating the snapshot as long as nothing changed besides the tick
    }
    return c.html(`<h1>Sum sum ${engine.time.tick}</h1>`);
  });

const { createRoutes } = await import('./routes');
createRoutes(app);

if (isProd) {
  const index = await html();
  const game = new GameRenderer();
  app.get('/*', (c) => {
    const lang = (getCookie(c, 'lang') as Language | undefined) ?? defaultLang;
    return c.html(game.render(engineInjector, index, 'Production Phlame', lang));
  });
} else {
  const game = new GameRenderer();

  app.get('/*', async (c) => {
    const engine = engineInjector.inject(EngineService);
    const lang = (getCookie(c, 'lang') as Language | undefined) ?? defaultLang;
    await sessionHelper(engine, c);
    const index = await html();
    return c.html(game.render(engineInjector, index, 'Dev Phlame', lang));
  });
}
export default app;

if (isProd) {
  /* eslint-disable-next-line @typescript-eslint/no-misused-spread */
  serve({ ...app, port: 4000 }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });
}
