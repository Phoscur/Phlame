import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { empireMiddleware } from './empire.middleware';
import { EngineService } from './engine.server';

const fakeEngine = {
  empire: { id: '42' },
} as EngineService;

describe('empireMiddleware', () => {
  it('allows matching empire id', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/42/test');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('rejects mismatching empire id', async () => {
    const app = new Hono();
    app.use('/empires/:empireId/*', empireMiddleware(fakeEngine));
    app.get('/empires/:empireId/test', (c) => c.text('ok'));

    const res = await app.request('/empires/99/test');
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Forbidden/);
  });
});
