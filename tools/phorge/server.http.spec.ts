import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { Hono } from 'hono';
import { bearerAuth } from './auth';

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
