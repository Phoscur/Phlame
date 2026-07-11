import { Hono } from 'hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { bearerAuth } from './auth';
import { registerTools } from './tools';

/**
 * Phorge HTTP app wiring (PLAN-CONTAINERS O1), extracted side-effect-free so the
 * spec exercises THE app — no env guard, no listener (server.http.ts owns those).
 *
 * Stateful streamable HTTP with a session map — the canonical SDK pattern:
 * every `initialize` (request without a session header) gets a FRESH
 * McpServer + transport pair; follow-up requests (POST calls, the GET SSE
 * stream, DELETE) carry `mcp-session-id` and route to their session's
 * transport. One transport per session is an SDK invariant — a shared
 * singleton collides on the second client, and the stateless mode drops the
 * GET stream real agents (agy) open. An unknown session id gets a 404 so
 * clients re-initialize after a Phorge restart. Cross-request state that must
 * survive sessions (concurrency counters, warm-up) lives in the runner
 * singleton in tools.ts, NOT here.
 *
 * Logging is one line per request, after the fact. Never log headers or
 * bodies here: headers carry the bearer token, and reading a clone of an SSE
 * response body blocks the reply until the stream ends (that exact bug held
 * back the GET stream and hung agy's client).
 */
export const MAX_SESSIONS = 32;

export function createMcpApp(token: string): Hono {
  const transports = new Map<string, WebStandardStreamableHTTPServerTransport>();

  const app = new Hono();
  app.use('*', async (c, next) => {
    await next();
    console.error(`[phorge] ${c.req.method} ${new URL(c.req.url).pathname} → ${c.res.status}`);
  });
  app.use('/mcp', bearerAuth(token));
  app.all('/mcp', async (c) => {
    const sessionId = c.req.header('mcp-session-id');
    if (sessionId) {
      const transport = transports.get(sessionId);
      if (!transport) {
        return c.json(
          {
            jsonrpc: '2.0',
            error: { code: -32001, message: 'session not found — initialize a new session' },
            id: null,
          },
          404,
        );
      }
      return transport.handleRequest(c.req.raw);
    }

    // No session header → this must be an initialize request: open a session.
    // (The SDK itself rejects non-initialize bodies on a fresh transport.)
    const server = new McpServer({ name: 'phorge', version: '0.2.0' });
    registerTools(server);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => globalThis.crypto.randomUUID(),
      onsessioninitialized: (id) => {
        // Bounded map: agents that never DELETE their session must not leak
        // transports forever — evict the oldest (Map preserves insert order).
        if (transports.size >= MAX_SESSIONS) {
          const [oldest] = transports.keys();
          void transports.get(oldest)?.close();
          transports.delete(oldest);
        }
        transports.set(id, transport);
      },
      onsessionclosed: (id) => {
        transports.delete(id);
      },
    });
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
  });
  return app;
}
