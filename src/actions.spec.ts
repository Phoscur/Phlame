import { describe, it, expect, beforeEach, vi } from 'vite-plus/test';
import { Hono } from 'hono';
import { createActionsRoute } from './actions';
import type { EmpireEnv } from './empire.middleware';
import { ActionTypes } from '@phlame/engine';
import type { EngineService } from './engine.server';

// the route runs behind empireMiddleware, which stashes the session's empire on the
// context (see empire.middleware.ts) - fake that here
function createApp(fakeEngine: EngineService, empire: unknown) {
  const app = new Hono<EmpireEnv>();
  app.use(async (c, next) => {
    c.set('empire', empire as EmpireEnv['Variables']['empire']);
    await next();
  });
  app.route('/', createActionsRoute(fakeEngine));
  return app;
}

describe('actionsRoute', () => {
  let app: ReturnType<typeof createApp>;
  let fakeEngine: EngineService;
  let mockEmpire: any;
  let mockEntity: any;

  beforeEach(() => {
    mockEntity = {
      id: '123',
      upcoming: [],
    };
    mockEmpire = {
      id: '42',
      entity: vi.fn().mockImplementation((id: string) => {
        if (id === '123') return mockEntity;
        throw new Error(`Unknown entity: ${id}`);
      }),
      enqueue: vi.fn().mockReturnValue({
        seq: 1,
        tick: 100,
        type: ActionTypes.UPDATE,
        concerns: ['123'],
        payload: { id: 'cmd-1', phelopmentID: 'farm', grade: 'up' },
      }),
    };
    // deliberately NO `empire` property: handlers must use the context capture,
    // never the EngineService singleton (parallel requests swap it)
    fakeEngine = {
      time: { tick: 100, timeMS: 1000 },
      saveSession: vi.fn(),
    } as unknown as EngineService;

    app = createApp(fakeEngine, mockEmpire);
  });

  it('GET should return empty list initially', async () => {
    const res = await app.request('/entities/123/actions');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it('GET should return mapped upcoming actions', async () => {
    mockEntity.upcoming = [
      {
        type: ActionTypes.UPDATE,
        concerns: { id: '123' },
        consequence: { at: 10, type: ActionTypes.UPDATE, payload: {} },
      },
    ];

    const res = await app.request('/entities/123/actions');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([
      {
        type: ActionTypes.UPDATE,
        concerns: '123',
        consequence: { at: 10, type: ActionTypes.UPDATE, payload: {} },
      },
    ]);
  });

  it('GET should return 404 for unknown entity', async () => {
    const res = await app.request('/entities/999/actions');
    expect(res.status).toBe(404);
  });

  it('POST should enqueue and return 201 log entry', async () => {
    const command = {
      type: 'update',
      payload: { id: 'cmd-1', phelopmentID: 'farm', grade: 'up' },
    };

    const postRes = await app.request('/entities/123/actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'sid=good-sid',
      },
      body: JSON.stringify(command),
    });

    expect(postRes.status).toBe(201);
    const json = await postRes.json();
    expect(json.seq).toBe(1);
    expect(json.tick).toBe(100);

    expect(mockEmpire.enqueue).toHaveBeenCalledWith(
      ActionTypes.UPDATE,
      command.payload,
      [mockEntity],
      100,
    );
    expect(fakeEngine.saveSession).toHaveBeenCalledWith({
      sid: 'good-sid',
      empire: mockEmpire,
    });
  });

  it('POST should return 404 for unknown entity', async () => {
    const command = {
      type: 'update',
      payload: { id: 'cmd-1', phelopmentID: 'farm', grade: 'up' },
    };
    const res = await app.request('/entities/999/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    expect(res.status).toBe(404);
  });

  it('POST should return 400 for bad schema', async () => {
    const badCommand = {
      type: 'create', // wrong type
      payload: { id: 'cmd-1' },
    };
    const res = await app.request('/entities/123/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badCommand),
    });
    expect(res.status).toBe(400);
  });

  it('POST should return 409 when queue is full', async () => {
    mockEmpire.enqueue.mockImplementationOnce(() => {
      throw new Error('Queue is full');
    });

    const command = {
      type: 'update',
      payload: { id: 'cmd-1', phelopmentID: 'farm', grade: 'up' },
    };
    const res = await app.request('/entities/123/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    expect(res.status).toBe(409);
  });
});
