// empire-middleware.ts
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { EngineService } from './engine.server';

/**
 * Loads the session and ensures the empireId in the route matches the current empire in the engine.
 * Responds with 401/404 if load fails, 403 if mismatch.
 */
export const empireMiddleware = (engine: EngineService) => {
  return async (c: Context, next: Next) => {
    const empireId = c.req.param('empireId');

    if (!empireId) {
      return c.json({ error: 'Empire ID is required' }, 400);
    }

    const sid = getCookie(c, 'sid');
    if (!sid) {
      return c.json({ error: 'Unauthorized: missing sid cookie' }, 401);
    }

    const loadCode = await engine.load(sid);
    if (loadCode !== 0) {
      return c.json({ error: 'Session load failed' }, loadCode === 2 ? 404 : 401);
    }

    const currentEmpire = engine.empire;
    if (`${currentEmpire.id}` !== empireId) {
      return c.json({ error: 'Forbidden: empire mismatch' }, 403);
    }

    await next();
  };
};
