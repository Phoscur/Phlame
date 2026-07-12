import { Hono } from 'hono';
import { z } from 'zod';
import { ActionTypes } from '@phlame/engine';
import { getCookie } from 'hono/cookie';
import type { EngineService } from './engine.server';

export const actionSchema = z.object({
  type: z.literal('update'),
  payload: z.object({
    id: z.string(),
    phelopmentID: z.string(),
    grade: z.enum(['up', 'down']),
  }),
});

export function createActionsRoute(engine: EngineService) {
  const actionsRoute = new Hono();

  // GET -> list upcoming actions for an entity
  actionsRoute.get('/entities/:id/actions', (c) => {
    const id = c.req.param('id');
    const empire = engine.empire;
    try {
      const entity = empire.entity(id);
      const actions = entity.upcoming.map((a) => ({ ...a, concerns: a.concerns.id }));
      return c.json(actions);
    } catch (e: any) {
      return c.json({ error: e.message }, 404);
    }
  });

  // POST -> validate body explicitly, return 400 on invalid JSON/validation error
  actionsRoute.post('/entities/:id/actions', async (c) => {
    const id = c.req.param('id');
    const empire = engine.empire;

    let entity;
    try {
      entity = empire.entity(id);
    } catch (e: any) {
      return c.json({ error: e.message }, 404);
    }

    let body: unknown;
    try {
      // safe JSON parse (catch invalid JSON)
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    // use safeParseAsync to avoid throwing; we handle errors explicitly
    const parsed = await actionSchema.safeParseAsync(body);
    if (!parsed.success) {
      // return structured zod error (flatten makes it easier to inspect)
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const command = parsed.data;

    try {
      const tick = engine.time.tick;
      const logEntry = empire.enqueue(ActionTypes.UPDATE, command.payload, [entity], tick);

      const sid = getCookie(c, 'sid');
      if (sid) {
        await engine.saveSession({ sid, empire });
      }

      return c.json(logEntry, 201);
    } catch (e: any) {
      if (e.message && e.message.includes('Queue is full')) {
        return c.json({ error: e.message }, 409);
      }
      return c.json({ error: e.message || 'Unknown error' }, 500);
    }
  });

  return actionsRoute;
}
