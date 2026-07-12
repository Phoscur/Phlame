import { describe, it, expect } from 'vite-plus/test';
import { Hono } from 'hono';
import { empireMiddleware, type EmpireEnv } from './empire.middleware';
import { EngineService } from './engine.server';

const fakeEngine = {
  loadEmpire: async (sid: string) => {
    if (sid === 'good-sid') return { id: '42' };
    if (sid === '404-sid') throw Object.assign(new Error('Not found'), { code: 404 });
    if (sid === '401-sid') throw Object.assign(new Error('Session corrupt'), { code: 401 });
    throw new Error('boom');
  },
} as unknown as EngineService;

describe('empireMiddleware', () => {
  it('allows matching empire id and captures the empire on the context', async () => {
    const app = new Hono<EmpireEnv>();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text(`ok ${c.get('empire').id}`));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=good-sid' },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok 42');
  });

  it('rejects missing cookie', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test');
    expect(res.status).toBe(401);
  });

  it('rejects invalid session with 404 if the load throws code 404', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=404-sid' },
    });
    expect(res.status).toBe(404);
  });

  it('rejects invalid session with 401 if the load throws code 401', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test', {
      headers: { Cookie: 'sid=401-sid' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects invalid session with 401 on a generic load error', async () => {
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
