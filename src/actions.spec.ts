import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createActionsRoute } from './actions';
import { ActionTypes } from '@phlame/engine';

function createApp() {
  const app = new Hono();
  app.route('/', createActionsRoute());
  return app;
}

describe('actionsRoute', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it('should return empty list initially', async () => {
    const res = await app.request('/entities/123/actions');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it('should add an action and retrieve it', async () => {
    const action = {
      type: ActionTypes.CREATE,
      concerns: { id: '123', type: 'monster' },
      consequence: {
        at: 0,
        type: ActionTypes.CREATE,
        payload: { hp: 10 },
      },
    };

    const postRes = await app.request('/entities/123/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });

    expect(postRes.status).toBe(200);

    const getRes = await app.request('/entities/123/actions');
    const json = await getRes.json();

    expect(json).toEqual([action]);
  });

  it('should reject if concerns.id mismatches', async () => {
    const badAction = {
      type: ActionTypes.CREATE,
      concerns: { id: '999', type: 'monster' },
      consequence: {
        at: 0,
        type: ActionTypes.CREATE,
        payload: {},
      },
    };

    const res = await app.request('/entities/123/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badAction),
    });

    expect(res.status).toBe(400);
  });
});
