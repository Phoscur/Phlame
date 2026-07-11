import { serve } from '@hono/node-server';
import { createMcpApp } from './http-app';

/**
 * Phorge — HTTP transport entry (PLAN-CONTAINERS O1). Host-owned, token-authed
 * endpoint that containerized agents reach without a Docker socket. The stdio
 * entry (server.ts) stays for host-side clients; both share tools.ts. The app
 * wiring (auth + session-mapped streamable HTTP) lives in http-app.ts, spec'd
 * there — this file is the env guard + listener only. @hono/node-server does
 * the node↔web-standard bridging: a hand-rolled bridge buffers SSE (node sends
 * headers on first write, the MCP GET stream stays silent until an event) and
 * that held agy's client in "waiting" forever.
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

serve({ fetch: app.fetch, port, hostname: '127.0.0.1' }, (info) => {
  console.error(`phorge mcp server ready (http://127.0.0.1:${info.port}/mcp)`);
});
