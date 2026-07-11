import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { Hono } from 'hono';
import { bearerAuth } from './auth';
import { createMcpApp } from './http-app';

/**
 * Phorge HTTP auth tests (PLAN-CONTAINERS O1): the REAL middleware from auth.ts
 * mounted on a stub endpoint, exercised via Hono's app.request() test helper —
 * no HTTP listener, no Docker, no env needed (server.http.ts is wiring only).
 */

function createTestApp(token: string) {
  const app = new Hono();
  app.use('/mcp', bearerAuth(token));
  // Stub MCP endpoint — the transport is SDK territory; auth is the unit here
  app.all('/mcp', (c) => c.json({ jsonrpc: '2.0', result: 'ok' }));
  return app;
}

function initializeRequest(token: string) {
  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'spec', version: '0' },
      },
    }),
  };
}

describe('phorge HTTP auth', () => {
  const TOKEN = 'test-secret-token-42';
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp(TOKEN);
  });

  it('rejects requests without an Authorization header → 401', async () => {
    const res = await app.request('/mcp', { method: 'POST' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/missing/i);
  });

  it('rejects requests with a malformed Authorization header → 401', async () => {
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/missing/i);
  });

  it('rejects requests with a wrong token → 401', async () => {
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-token-but-same-l' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  it('rejects requests with a token of different length → 401', async () => {
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: { Authorization: 'Bearer x' },
    });
    expect(res.status).toBe(401);
  });

  it('passes requests with the correct token through', async () => {
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toBe('ok');
  });

  it('passes GET requests with the correct token (SSE stream endpoint)', async () => {
    const res = await app.request('/mcp', {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.status).toBe(200);
  });
});

describe('phorge HTTP transport (stateless, per-request)', () => {
  const TOKEN = 'test-secret-token-42';

  // Regression: the stateless SDK transport throws "cannot be reused across
  // requests" on the SECOND request if it's a module-level singleton. A single
  // curl handshake never trips it; a real MCP client (initialize → tools/list →
  // call) does. Two sequential initialize calls reproduce it without protocol
  // subtleties — both must succeed against the real app wiring.
  it('handles two sequential requests without reusing the transport', async () => {
    const app = createMcpApp(TOKEN);

    const first = await app.request('/mcp', initializeRequest(TOKEN));
    expect(first.status).toBe(200);

    const second = await app.request('/mcp', initializeRequest(TOKEN));
    expect(second.status).toBe(200);
    const body = await second.text();
    expect(body).not.toMatch(/reused/i);
  });

  it('still enforces auth on the real transport endpoint', async () => {
    const app = createMcpApp(TOKEN);
    const res = await app.request('/mcp', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
