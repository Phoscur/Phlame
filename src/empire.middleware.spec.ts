import { describe, it, expect } from 'vite-plus/test';
import { Hono } from 'hono';
import { empireMiddleware } from './empire.middleware';
import { EngineService } from './engine.server';

const fakeEngine = {
  empire: { id: '42' },
  load: async (sid: string) => {
    if (sid === 'good-sid') return 0;
    if (sid === '404-sid') return 404;
    if (sid === '401-sid') return 401;
    return 1;
  },
} as unknown as EngineService;

describe('empireMiddleware', () => {
  it('allows matching empire id', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=good-sid' },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('rejects missing cookie', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test');
    expect(res.status).toBe(401);
  });

  it('rejects invalid session with 404 if load returns 404', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=404-sid' },
    });
    expect(res.status).toBe(404);
  });

  it('rejects invalid session with 401 if load returns 401', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=401-sid' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects invalid session with 401 if load returns generic error', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=other-sid' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects mismatching empire id', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/99/test', {
      headers: { Cookie: 'sid=good-sid' },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Forbidden/);
  });
});
