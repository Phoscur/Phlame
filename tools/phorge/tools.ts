import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  planLogs,
  planPs,
  planBuild,
  planDown,
  planAgentUp,
  planAgyModels,
  RUN_VERBS,
  SERVICES,
} from './plan';
import { execDocker, stripAnsi, tail, type ExecResult } from './exec';
import { createRunner } from './run';

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

/**
 * The slug feeds a container path AND a git branch name (plan.ts
 * agentWorktree) — the strict charset is the injection guard.
 */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,38}$/;

const WORKTREE_SLUG = z
  .string()
  .regex(SLUG_PATTERN)
  .optional()
  .describe(
    'task slug: run in git worktree .worktrees/<slug> on branch agent/<slug> — created on first use, reused on repeat dispatches (commits accumulate). Collect on the host: git diff <base>...agent/<slug>, merge, git worktree remove .worktrees/<slug>',
  );

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

// Orchestration (concurrency, warm-up, reaping) lives in run.ts — spec'd there.
const { execRun, execAgent, execFmt } = createRunner();

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
        'Run a fixed verb in the ephemeral containers (dev overlay: live source, no rebuild needed): test (vitest app+engine), tsc, lint (vp lint + vp fmt --check), e2e (playwright, 3 browsers), screenshot (chromium only, writes screenshots/home.png). test and e2e take an optional file to run a single spec. Returns the output tail; pass verbose for the full (capped) output.',
      inputSchema: {
        verb: z.enum(RUN_VERBS),
        file: z
          .string()
          .optional()
          .describe(
            'single spec file for verb test (vitest, e.g. tools/phorge/plan.spec.ts — a unique basename like plan.spec.ts works too) or e2e (playwright, under tests/ — a single e2e spec runs on chromium only, vs. all three browsers for the full e2e verb). Validated against the discovered spec list; a miss returns the known specs.',
          ),
        verbose: z
          .boolean()
          .optional()
          .describe(`full output up to ${VERBOSE_TAIL_CHARS} chars instead of the default tail`),
      },
    },
    async ({ verb, file, verbose }) => {
      try {
        const { result, note } = await execRun(verb, file);
        return verdict(verb, result, note, verbose ? VERBOSE_TAIL_CHARS : TAIL_CHARS);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'fmt',
    {
      description:
        'Format the tree in place (npx vp fmt; options in vite.config.ts). Runs in the agent container — the run verbs mount source read-only and their lint verb only checks; this is the containerized write path. Optional worktree slug formats an existing agent worktree instead of the live tree.',
      inputSchema: {
        worktree: z
          .string()
          .regex(SLUG_PATTERN)
          .optional()
          .describe(
            'format the existing agent worktree .worktrees/<slug> instead of the live tree',
          ),
      },
    },
    async ({ worktree }) => {
      try {
        const { result, note } = await execFmt(worktree);
        return verdict('fmt', result, note);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'agy',
    {
      description:
        'Run a headless agy (Antigravity CLI) prompt inside an agent container (compose.agents.yml) and return its answer. agy follows /phlame/AGENTS.md and has the phorge MCP wired up, so it can run verbs itself. Permissions are auto-approved INSIDE the container only — the container wall is the boundary. Two agent slots shared with claude, 6-minute timeout; returns the output tail, pass verbose for more.',
      inputSchema: {
        prompt: z.string().min(1).describe('the task/question for the containerized agy run'),
        verbose: z
          .boolean()
          .optional()
          .describe(`full output up to ${VERBOSE_TAIL_CHARS} chars instead of the default tail`),
        model: z
          .enum([
            'Gemini 3.5 Flash (Medium)',
            'Gemini 3.5 Flash (High)',
            'Gemini 3.5 Flash (Low)',
            'Gemini 3.1 Pro (Low)',
            'Gemini 3.1 Pro (High)',
            'Claude Sonnet 4.6 (Thinking)',
            'Claude Opus 4.6 (Thinking)',
            'GPT-OSS 120B (Medium)',
          ])
          .optional()
          .describe('the model to use (default: Gemini 3.1 Pro (High))'),
        worktree: WORKTREE_SLUG,
      },
    },
    async ({ prompt, verbose, model, worktree }) => {
      try {
        const { result, note } = await execAgent('agy', prompt, model, worktree);
        return verdict('agy', result, note, verbose ? VERBOSE_TAIL_CHARS : TAIL_CHARS);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'claude',
    {
      description:
        'Run a headless claude (Claude Code) prompt inside an agent container (compose.agents.yml) and return its answer. Same yolo mode as agy (permissions auto-approved INSIDE the container — the wall is the boundary), follows /phlame/AGENTS.md; phorge is wired over HTTP (--strict-mcp-config, generated config). Two agent slots shared with agy; 6-minute timeout; returns the output tail, pass verbose for more.',
      inputSchema: {
        prompt: z.string().min(1).describe('the task/question for the containerized claude run'),
        verbose: z
          .boolean()
          .optional()
          .describe(`full output up to ${VERBOSE_TAIL_CHARS} chars instead of the default tail`),
        model: z
          .string()
          .optional()
          .describe(
            "the model to use: 'sonnet', 'opus', 'haiku' or a full model id (default: the account's default)",
          ),
        worktree: WORKTREE_SLUG,
      },
    },
    async ({ prompt, verbose, model, worktree }) => {
      try {
        const { result, note } = await execAgent('claude', prompt, model, worktree);
        return verdict('claude', result, note, verbose ? VERBOSE_TAIL_CHARS : TAIL_CHARS);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    'models',
    {
      description:
        "List the models the containerized agents can run: agy's live list (`agy models`) plus claude's aliases. Use the exact labels/aliases as the `model` parameter of the agy/claude tools.",
      inputSchema: {},
    },
    async () => {
      try {
        const up = await execDocker(planAgentUp());
        if (up.code !== 0) {
          return verdict('models', up, 'compose up -d agent failed');
        }
        const result = await execDocker(planAgyModels(), { timeoutMs: 60_000 });
        const claudeNote =
          "\nclaude models: 'sonnet' | 'opus' | 'haiku' or a full model id (e.g. claude-sonnet-5).";
        return verdict('models', { ...result, output: result.output + claudeNote });
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
        // The artifact sink is the agent worktree (compose mounts it there) —
        // resolve against it, not phorge's own cwd (clean checkout under O1).
        const png = await readFile(
          join(process.env.PHLAME_WORKTREE ?? '.', 'screenshots', 'home.png'),
        );
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
