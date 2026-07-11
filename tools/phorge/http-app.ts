import { Hono } from 'hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { bearerAuth } from './auth';
import { registerTools } from './tools';

/**
 * Phorge HTTP app wiring (PLAN-CONTAINERS O1), extracted side-effect-free so the
 * spec exercises THE app — no env guard, no listener (server.http.ts owns those).
 *
 * Stateless transport: a FRESH McpServer + transport is built per request. The SDK
 * forbids reusing a stateless transport across requests (webStandardStreamableHttp
 * throws "Stateless transport cannot be reused across requests"), so a module-level
 * singleton — which a single-request curl handshake never trips — dies the moment a
 * real client does initialize → tools/list → call. Per-request instances are cheap;
 * the concurrency/warm-up state that must persist lives in the runner singleton in
 * tools.ts (module-level), not in the server or transport.
 */
export function createMcpApp(token: string): Hono {
  const app = new Hono();
  app.use('*', async (c, next) => {
    const method = c.req.method;
    const url = c.req.url;
    console.error(`[Phorge HTTP] >>> ${method} ${url}`);
    console.error(`[Phorge HTTP] Request Headers: ${JSON.stringify(c.req.header())}`);
    if (method === 'POST') {
      const cloned = c.req.raw.clone();
      try {
        const bodyText = await cloned.text();
        console.error(`[Phorge HTTP] Request Body: ${bodyText}`);
      } catch (e) {
        console.error(`[Phorge HTTP] Request Body Error: ${String(e)}`);
      }
    }
    await next();
    console.error(`[Phorge HTTP] <<< Response Status: ${c.res.status}`);
    console.error(`[Phorge HTTP] Response Headers: ${JSON.stringify(Object.fromEntries(c.res.headers.entries()))}`);
    if (c.res.body) {
      const clonedRes = c.res.clone();
      try {
        const bodyText = await clonedRes.text();
        console.error(`[Phorge HTTP] Response Body: ${bodyText}`);
      } catch (e) {
        console.error(`[Phorge HTTP] Response Body Error: ${String(e)}`);
      }
    }
  });

  const server = new McpServer({ name: 'phorge', version: '0.2.0' });
  registerTools(server);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => globalThis.crypto.randomUUID(),
    enableJsonResponse: false,
  });

  let connected = false;

  app.use('/mcp', bearerAuth(token));
  app.all('/mcp', async (c) => {
    if (!connected) {
      connected = true;
      await server.connect(transport);
    }
    return transport.handleRequest(c.req.raw);
  });
  return app;
}
