import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  planRun,
  planRm,
  planLogs,
  planPs,
  planBuild,
  planDown,
  RUN_VERBS,
  SERVICES,
  type RunVerb,
} from './plan';
import { execDocker, tail, type ExecResult } from './exec';

/**
 * Phorge tool registry (PLAN-CONTAINERS O1): transport-agnostic tool
 * definitions + handlers. Both the stdio entry (server.ts) and the HTTP
 * entry (server.http.ts) call registerTools on their own McpServer instance.
 */

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function fail(error: unknown) {
  return {
    content: [{ type: 'text' as const, text: error instanceof Error ? error.message : `${error}` }],
    isError: true,
  };
}

function verdict(label: string, result: ExecResult, note = '') {
  const flags = [
    result.timedOut ? 'TIMEOUT' : '',
    result.truncated ? 'output capped at 1MiB' : '',
    note,
  ]
    .filter(Boolean)
    .join(', ');
  const text = `${label}: exit ${result.code}${flags ? ` (${flags})` : ''}\n${tail(result.output)}`;
  return result.code === 0 ? ok(text) : { ...ok(text), isError: true };
}

/**
 * Execute a run verb; on timeout, reap the named one-off container. The timeout
 * kill only reaches the docker CLI client — the container itself would keep
 * running in the daemon and block the next run on the name conflict.
 */
async function execRun(verb: RunVerb): Promise<{ result: ExecResult; note: string }> {
  const result = await execDocker(planRun(verb));
  if (!result.timedOut) {
    return { result, note: '' };
  }
  try {
    await execDocker(planRm(verb), { timeoutMs: 30_000 });
    return { result, note: 'orphaned run container removed' };
  } catch {
    return {
      result,
      note: `orphaned run container NOT removed — docker rm -f ${planRm(verb).at(-1)}`,
    };
  }
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    'status',
    {
      description:
        'Discovery: the containerized runner stack (compose.test.yml) — services, container states, and the available run verbs.',
      inputSchema: {},
    },
    async () => {
      try {
        const ps = await execDocker(planPs());
        return ok(
          `services: ${SERVICES.join(', ')}\nrun verbs: ${RUN_VERBS.join(', ')}\n\n${ps.output || '(no containers)'}`,
        );
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'run',
    {
      description:
        'Run a fixed verb in the ephemeral containers (dev overlay: live source, no rebuild needed): test (vitest app+engine), tsc, lint (oxlint+eslint), e2e (playwright, 3 browsers), screenshot (chromium only, writes screenshots/home.png).',
      inputSchema: { verb: z.enum(RUN_VERBS) },
    },
    async ({ verb }) => {
      try {
        const { result, note } = await execRun(verb);
        return verdict(verb, result, note);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'screenshot',
    {
      description:
        'Take a full-page screenshot of the running game (via tests/screenshot.spec.ts in the playwright container) and return the image inline.',
      inputSchema: {},
    },
    async () => {
      try {
        const { result, note } = await execRun('screenshot');
        if (result.code !== 0) {
          return verdict('screenshot', result, note);
        }
        const png = await readFile('screenshots/home.png');
        return {
          content: [
            { type: 'text' as const, text: 'screenshots/home.png' },
            { type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' },
          ],
        };
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'logs',
    {
      description:
        'Probe a service log (tail, capped at 500 lines). The phlame service (the app) keeps running after e2e/screenshot runs — its log is the smoke trail.',
      inputSchema: {
        service: z.enum(SERVICES),
        tail: z.number().int().positive().max(500).optional().describe('lines, default 50'),
      },
    },
    async ({ service, tail: lines }) => {
      try {
        const result = await execDocker(planLogs(service, lines ?? 50));
        return verdict(`logs ${service}`, result);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'build',
    {
      description:
        'Rebuild the runner images (needed after dependency/lockfile changes — the npm ci layer keys on the lockfile; source edits need no rebuild thanks to the dev overlay).',
      inputSchema: {},
    },
    async () => {
      try {
        return verdict('build', await execDocker(planBuild()));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'down',
    {
      description: 'Stop the runner stack (the warm phlame app service and the compose network).',
      inputSchema: {},
    },
    async () => {
      try {
        return verdict('down', await execDocker(planDown()));
      } catch (error) {
        return fail(error);
      }
    },
  );
}
