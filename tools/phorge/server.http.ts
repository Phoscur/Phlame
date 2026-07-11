import { createServer } from 'node:http';
import { createMcpApp } from './http-app';

/**
 * Phorge — HTTP transport entry (PLAN-CONTAINERS O1). Host-owned, token-authed
 * endpoint that containerized agents reach without a Docker socket. The stdio
 * entry (server.ts) stays for host-side clients; both share tools.ts. The app
 * wiring (auth + stateless per-request transport) lives in http-app.ts, spec'd
 * there — this file is the env guard + node listener only.
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

const app = createMcpApp(PHORGE_TOKEN);

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
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }
  if (response.body) {
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      res.write(':\n\n');
    }
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } else {
    res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.error(`phorge mcp server ready (http://127.0.0.1:${port}/mcp)`);
});
