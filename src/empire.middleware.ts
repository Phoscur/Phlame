// empire-middleware.ts
import type { Context, Next } from 'hono';
import type { EngineService } from './engine.server';

/**
 * Ensures the empireId in the route matches the current empire in the engine.
 * Responds with 403 if mismatch.
 */
export const empireMiddleware = (engine: EngineService) => {
  return async (c: Context, next: Next) => {
    const empireId = c.req.param('empireId');

    if (!empireId) {
      return c.json({ error: 'Empire ID is required' }, 400);
    }

    const currentEmpire = engine.empire;
    if (`${currentEmpire.id}` !== empireId) {
      return c.json({ error: 'Forbidden: empire mismatch' }, 403);
    }

    // TODO accessing a different empire would mean either a different savegame and or a different player's
    // could just generate a new one here if needed?

    await next();
  };
};
