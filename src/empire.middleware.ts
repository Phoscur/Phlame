// empire-middleware.ts
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { EngineService } from './engine.server';
import type { EmpireEntity } from './app/engine';

/** Hono env for routes behind the empireMiddleware: the request's own empire */
export type EmpireEnv = { Variables: { empire: EmpireEntity } };

/**
 * Loads the sid cookie's session and stashes ITS empire on the context (`c.get('empire')`).
 * Handlers must use that capture - the EngineService empire is a singleton a parallel
 * request may swap at any await point. Responds 401/404 if the load fails,
 * 403 if the route's empireId does not belong to the session.
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

    let empire: EmpireEntity;
    try {
      empire = await engine.loadEmpire(sid);
    } catch (e: any) {
      return c.json({ error: 'Session load failed' }, e?.code === 404 ? 404 : 401);
    }

    if (`${empire.id}` !== empireId) {
      return c.json({ error: `Forbidden: empire mismatch (${empire.id} != ${empireId})` }, 403);
    }
    c.set('empire', empire);

    await next();
  };
};
