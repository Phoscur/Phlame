import { timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

/**
 * Constant-time bearer token middleware (PLAN-CONTAINERS O1: identity must not
 * be a self-asserted string). Length differences are rejected before
 * timingSafeEqual, which requires equal-length buffers. Extracted into its own
 * side-effect-free module so the spec exercises THE middleware, not a copy —
 * the server entry (server.http.ts) keeps its env guard and listener to itself.
 */
export function bearerAuth(token: string): MiddlewareHandler {
  const expected = Buffer.from(token, 'utf8');
  return async (c, next) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return c.json({ error: 'missing or malformed Authorization header' }, 401);
    }
    const candidate = Buffer.from(auth.slice(7), 'utf8');
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      return c.json({ error: 'invalid token' }, 401);
    }
    await next();
  };
}
