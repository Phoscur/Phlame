import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerTools } from './tools';

/**
 * Phorge — HTTP transport entry (PLAN-CONTAINERS O1). Host-owned, token-authed
 * endpoint that containerized agents reach without a Docker socket. The stdio
 * entry (server.ts) stays for host-side clients; both share tools.ts.
 *
 * Env:
 *   PHORGE_TOKEN  — required, bearer token for auth (fail-closed: missing = exit)
 *   PHORGE_PORT   — optional, default 4201
 */

const PHORGE_TOKEN = process.env.PHORGE_TOKEN;
if (!PHORGE_TOKEN) {
  console.error('PHORGE_TOKEN is required — set it in the environment.');
  process.exit(1);
}

const port = Number(process.env.PHORGE_PORT) || 4201;

// --- Bearer token auth -------------------------------------------------------

const tokenBytes = Buffer.from(PHORGE_TOKEN, 'utf8');

/**
 * Constant-time bearer token check. Returns true if the Authorization header
 * carries a valid `Bearer <token>`, false otherwise. Length differences are
 * caught before timingSafeEqual (which requires equal-length buffers).
 */
export function verifyBearer(header: string | null | undefined): boolean {
  if (!header?.startsWith('Bearer ')) return false;
  const candidate = Buffer.from(header.slice(7), 'utf8');
  if (candidate.length !== tokenBytes.length) return false;
  return timingSafeEqual(candidate, tokenBytes);
}

// --- Hono app ----------------------------------------------------------------

export function createApp(token?: string): Hono {
  // Allow tests to inject a different token (they can't set process.env before
  // the module-level guard). When called from the main block below, `token` is
  // undefined and the module-level tokenBytes are used.
  const expected = token ? Buffer.from(token, 'utf8') : tokenBytes;

  const app = new Hono();

  // Auth middleware — runs before the MCP transport handler
  app.use('/mcp', async (c, next) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return c.json({ error: 'missing or malformed Authorization header' }, 401);
    }
    const candidate = Buffer.from(auth.slice(7), 'utf8');
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      return c.json({ error: 'invalid token' }, 401);
    }
    await next();
  });

  return app;
}

// --- MCP transport -----------------------------------------------------------

const mcpServer = new McpServer({ name: 'phorge', version: '0.2.0' });
registerTools(mcpServer);

const transport = new WebStandardStreamableHTTPServerTransport({
  // Stateless: Phorge tools are fire-and-forget compose commands; no session
  // state to track. Eliminates session-mismatch 404s for reconnecting agents.
  sessionIdGenerator: undefined,
});
await mcpServer.connect(transport);

const app = createApp();

// Mount the MCP transport on /mcp — supports POST (requests) and GET (SSE stream)
app.all('/mcp', async (c) => {
  const response = await transport.handleRequest(c.req.raw);
  return response;
});

// --- HTTP server (localhost only) --------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const method = req.method ?? 'GET';
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  // Read request body for POST
  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk as Uint8Array);
    body = Buffer.concat(chunks);
  }

  const request = new Request(url.href, { method, headers, body });
  const response = await app.fetch(request);

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  if (response.body) {
    const reader = response.body.getReader();
    const pump = async () => {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    await pump();
  } else {
    res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.error(`phorge mcp server ready (http://127.0.0.1:${port}/mcp)`);
});
