import { Hono } from 'hono';
import { z } from 'zod';
import { Action, ActionTypes, type ActionType } from '@phlame/engine';

// in-memory store
const entityActions = new Map<string, Action<ActionType>[]>();

export const clearEntityActions = () => entityActions.clear();

export const actionSchema = z.object({
  type: z.enum([ActionTypes.CREATE, ActionTypes.UPDATE]),
  concerns: z.object({
    id: z.string(),
    type: z.string(),
  }),
  consequence: z.object({
    at: z.number().int().nonnegative(),
    type: z.enum([ActionTypes.CREATE, ActionTypes.UPDATE]),
    // explicit key schema + value schema to satisfy linters/typings
    payload: z.record(z.string(), z.unknown()),
  }),
});

export function createActionsRoute() {
  const actionsRoute = new Hono();

  // GET -> list actions for an entity
  actionsRoute.get('/entities/:id/actions', (c) => {
    const id = c.req.param('id');
    const actions = entityActions.get(id) ?? [];
    return c.json(actions);
  });

  // POST -> validate body explicitly, return 400 on invalid JSON/validation error
  actionsRoute.post('/entities/:id/actions', async (c) => {
    const id = c.req.param('id');

    let body: unknown;
    try {
      // safe JSON parse (catch invalid JSON)
      body = await c.req.json();
    } catch (err) {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    // use safeParseAsync to avoid throwing; we handle errors explicitly
    const parsed = await actionSchema.safeParseAsync(body);
    if (!parsed.success) {
      // return structured zod error (flatten makes it easier to inspect)
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const action = parsed.data as Action<ActionType>;

    if (action.concerns.id !== id) {
      return c.json({ error: 'concerns.id must match entity id' }, 400);
    }

    const actions = entityActions.get(id) ?? [];
    actions.push(action);
    entityActions.set(id, actions);

    return c.json({ ok: true });
  });

  return actionsRoute;
}
