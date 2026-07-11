import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  planRun,
  planRm,
  planUp,
  planRestart,
  planLogs,
  planPs,
  planBuild,
  planDown,
  RUN_VERBS,
  SERVICES,
  type RunVerb,
} from './plan';
import { execDocker, stripAnsi, tail, type ExecResult } from './exec';

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

/** Default verdicts are a tail — the outcome lives at the end; verbose opts into more. */
const TAIL_CHARS = 4000;
const VERBOSE_TAIL_CHARS = 50_000;

function verdict(label: string, result: ExecResult, note = '', chars = TAIL_CHARS) {
  const flags = [
    result.timedOut ? 'TIMEOUT' : '',
    result.truncated ? 'output capped at 1MiB' : '',
    note,
  ]
    .filter(Boolean)
    .join(', ');
  const output = tail(stripAnsi(result.output), chars);
  const text = `${label}: exit ${result.code}${flags ? ` (${flags})` : ''}\n${output}`;
  return result.code === 0 ? ok(text) : { ...ok(text), isError: true };
}

let activeRunnerRuns = 0;
let activePlaywrightRuns = 0;
const MAX_RUNNER_CONCURRENCY = 4;
const MAX_PLAYWRIGHT_CONCURRENCY = 1;

/**
 * Reap after a timeout kill — which only reaches the docker CLI client. For
 * `run --rm` (runner) the orphaned named container is removed; for `exec`
 * (playwright) the test process keeps running inside the sleeping container,
 * so the service is restarted to end it.
 */
async function reap(verb: RunVerb, runId: string): Promise<string> {
  if (verb === 'e2e' || verb === 'screenshot') {
    try {
      await execDocker(planRestart('playwright'), { timeoutMs: 60_000 });
      return 'playwright restarted — timed-out test process reaped';
    } catch {
      return 'timed-out test process NOT reaped — run: docker compose -f compose.test.yml restart playwright';
    }
  }
  const rmPlan = planRm(verb, runId);
  try {
    await execDocker(rmPlan, { timeoutMs: 30_000 });
    return 'orphaned run container removed';
  } catch {
    return `orphaned run container NOT removed — docker rm -f ${rmPlan.at(-1)}`;
  }
}

/**
 * Execute a run verb with concurrency limits. Playwright verbs run via `exec`
 * in the sleeping container — ensured up (idempotent, heals config drift) first,
 * so a cold stack warms itself instead of failing with "service is not running".
 */
async function execRun(verb: RunVerb): Promise<{ result: ExecResult; note: string }> {
  const isPlaywright = verb === 'e2e' || verb === 'screenshot';

  if (isPlaywright) {
    if (activePlaywrightRuns >= MAX_PLAYWRIGHT_CONCURRENCY) {
      throw new Error(
        `Max concurrency reached for Playwright (limit: ${MAX_PLAYWRIGHT_CONCURRENCY}). Please wait.`,
      );
    }
    activePlaywrightRuns++;
  } else {
    if (activeRunnerRuns >= MAX_RUNNER_CONCURRENCY) {
      throw new Error(
        `Max concurrency reached for runner (limit: ${MAX_RUNNER_CONCURRENCY}). Please wait.`,
      );
    }
    activeRunnerRuns++;
  }

  try {
    if (isPlaywright) {
      const up = await execDocker(planUp('playwright'));
      if (up.code !== 0) {
        return { result: up, note: 'compose up -d playwright failed' };
      }
    }
    const runId = randomUUID().slice(0, 8);
    const result = await execDocker(planRun(verb, runId));
    if (!result.timedOut) {
      return { result, note: '' };
    }
    return { result, note: await reap(verb, runId) };
  } finally {
    if (isPlaywright) activePlaywrightRuns--;
    else activeRunnerRuns--;
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
        'Run a fixed verb in the ephemeral containers (dev overlay: live source, no rebuild needed): test (vitest app+engine), tsc, lint (oxlint+eslint+prettier --check), e2e (playwright, 3 browsers), screenshot (chromium only, writes screenshots/home.png). Returns the output tail; pass verbose for the full (capped) output.',
      inputSchema: {
        verb: z.enum(RUN_VERBS),
        verbose: z
          .boolean()
          .optional()
          .describe(`full output up to ${VERBOSE_TAIL_CHARS} chars instead of the default tail`),
      },
    },
    async ({ verb, verbose }) => {
      try {
        const { result, note } = await execRun(verb);
        return verdict(verb, result, note, verbose ? VERBOSE_TAIL_CHARS : TAIL_CHARS);
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
