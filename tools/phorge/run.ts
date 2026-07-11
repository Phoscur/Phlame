import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  planRun,
  planRm,
  planUp,
  planRestart,
  planAgentUp,
  planAgy,
  planClaude,
  planAgentRestart,
  planWorktreeCheck,
  planWorktreeAdd,
  agentWorktree,
  type RunVerb,
} from './plan';
import { execDocker, type ExecLimits, type ExecResult } from './exec';

export type Exec = (argv: string[], limits?: ExecLimits) => Promise<ExecResult>;
export type AgentCli = 'agy' | 'claude';

export const MAX_RUNNER_CONCURRENCY = 4;
export const MAX_PLAYWRIGHT_CONCURRENCY = 1;
/** one agent run at a time per replica — agy and claude share the pool */
export const MAX_AGENT_CONCURRENCY = 2;
/** agy's own print-mode timeout is 5min — give the verbs a minute of headroom */
export const AGENT_TIMEOUT_MS = 6 * 60_000;

const AGENT_PLANS: Record<
  AgentCli,
  (slot: number, prompt: string, model?: string, workdir?: string) => string[]
> = {
  agy: planAgy,
  claude: planClaude,
};

/**
 * Run-verb orchestration: concurrency limits, warm-up for the exec verbs and
 * timeout reaping. A factory with an injectable executor so this — the most
 * intricate phorge logic — is testable without Docker (run.spec.ts); the
 * counters live in the closure, one pool per runner instance.
 */
export function createRunner(exec: Exec = execDocker) {
  let activeRunnerRuns = 0;
  let activePlaywrightRuns = 0;
  // slot N ↔ container phlame-agents-agent-N (compose deploy.replicas)
  const freeAgentSlots = new Set(Array.from({ length: MAX_AGENT_CONCURRENCY }, (_, i) => i + 1));

  /**
   * Reap after a timeout kill — which only reaches the docker CLI client. For
   * `run --rm` (runner) the orphaned named container is removed; for `exec`
   * (playwright) the test process keeps running inside the sleeping container,
   * so the service is restarted to end it.
   */
  async function reap(verb: RunVerb, runId: string): Promise<string> {
    if (verb === 'e2e' || verb === 'screenshot') {
      try {
        await exec(planRestart('playwright'), { timeoutMs: 60_000 });
        return 'playwright restarted — timed-out test process reaped';
      } catch {
        return 'timed-out test process NOT reaped — run: docker compose -f compose.test.yml restart playwright';
      }
    }
    const rmPlan = planRm(verb, runId);
    try {
      await exec(rmPlan, { timeoutMs: 30_000 });
      return 'orphaned run container removed';
    } catch {
      return `orphaned run container NOT removed — docker rm -f ${rmPlan.at(-1)}`;
    }
  }

  /**
   * Execute a run verb with concurrency limits. Playwright verbs run via `exec`
   * in the sleeping container — ensured up (idempotent, heals config drift)
   * first, so a cold stack warms itself instead of failing with "service is
   * not running".
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
        const up = await exec(planUp('playwright'));
        if (up.code !== 0) {
          return { result: up, note: 'compose up -d playwright failed' };
        }
      }
      const runId = randomUUID().slice(0, 8);
      const result = await exec(planRun(verb, runId));
      if (!result.timedOut) {
        return { result, note: '' };
      }
      return { result, note: await reap(verb, runId) };
    } finally {
      if (isPlaywright) activePlaywrightRuns--;
      else activeRunnerRuns--;
    }
  }

  /**
   * Headless agent run (agy or claude) in the agent container
   * (compose.agents.yml): warm-up first (the container's start command seeds
   * config/credentials), then the exec — one at a time across both CLIs, a
   * timed-out run is reaped via service restart (the same client-only-kill
   * hole as the playwright exec verbs).
   */
  async function execAgent(
    cli: AgentCli,
    prompt: string,
    model?: string,
    worktree?: string,
  ): Promise<{ result: ExecResult; note: string }> {
    if (freeAgentSlots.size === 0) {
      throw new Error(
        `Max concurrency reached for the agent container (limit: ${MAX_AGENT_CONCURRENCY}). Please wait.`,
      );
    }
    const slot = [...freeAgentSlots][0];
    freeAgentSlots.delete(slot);
    try {
      const up = await exec(planAgentUp());
      if (up.code !== 0) {
        return { result: up, note: 'compose up -d agent failed' };
      }
      let workdir: string | undefined;
      let note = '';
      if (worktree) {
        // Idempotent: create the task worktree on first use, reuse it after —
        // repeat dispatches accumulate commits on the same agent/<slug> branch.
        const check = await exec(planWorktreeCheck(slot, worktree), { timeoutMs: 30_000 });
        if (check.code !== 0) {
          const add = await exec(planWorktreeAdd(slot, worktree), { timeoutMs: 60_000 });
          if (add.code !== 0) {
            return { result: add, note: `git worktree add failed for ${worktree}` };
          }
          note = `worktree ${agentWorktree(worktree).path} created (branch ${agentWorktree(worktree).branch})`;
        } else {
          note = `worktree ${agentWorktree(worktree).path} reused`;
        }
        workdir = agentWorktree(worktree).path;
      }
      const result = await exec(AGENT_PLANS[cli](slot, prompt, model, workdir), {
        timeoutMs: AGENT_TIMEOUT_MS,
        logFile: join(process.cwd(), 'logs', `agent-${slot}.log`),
      });
      if (!result.timedOut) {
        return { result, note };
      }
      try {
        await exec(planAgentRestart(slot), { timeoutMs: 60_000 });
        return { result, note: `${note} agent restarted — timed-out ${cli} process reaped`.trim() };
      } catch {
        return {
          result,
          note: `${note} timed-out ${cli} NOT reaped — run: docker restart phlame-agents-agent-${slot}`.trim(),
        };
      }
    } finally {
      freeAgentSlots.add(slot);
    }
  }

  return { execRun, execAgent };
}
