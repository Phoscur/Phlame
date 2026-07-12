import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  planRun,
  planRm,
  planSpec,
  planSpecRm,
  planUp,
  planRestart,
  planAgentUp,
  planAgy,
  planClaude,
  planAgentRestart,
  planWorktreeCheck,
  planWorktreeAdd,
  planFmt,
  agentWorktree,
  type RunVerb,
} from './plan';
import { listSpecs, resolveSpec, type SpecList } from './specs';
import { execDocker, type ExecLimits, type ExecResult } from './exec';

export type Exec = (argv: string[], limits?: ExecLimits) => Promise<ExecResult>;
export type Discover = () => Promise<SpecList>;
export type AgentCli = 'agy' | 'claude';

export const MAX_RUNNER_CONCURRENCY = 4;
export const MAX_PLAYWRIGHT_CONCURRENCY = 1;
/** one agent run at a time per replica — agy and claude share the pool */
export const MAX_AGENT_CONCURRENCY = 2;
/** agy's own print-mode timeout is 5min — give the verbs a minute of headroom */
export const AGENT_TIMEOUT_MS = 6 * 60_000;
/** oxfmt over the whole tree takes seconds — 2min is generous */
export const FMT_TIMEOUT_MS = 2 * 60_000;

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
export function createRunner(exec: Exec = execDocker, discover: Discover = listSpecs) {
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
  async function reap(isPlaywright: boolean, rmArgv: string[]): Promise<string> {
    if (isPlaywright) {
      try {
        await exec(planRestart('playwright'), { timeoutMs: 60_000 });
        return 'playwright restarted — timed-out test process reaped';
      } catch {
        return 'timed-out test process NOT reaped — run: docker compose -f compose.test.yml restart playwright';
      }
    }
    try {
      await exec(rmArgv, { timeoutMs: 30_000 });
      return 'orphaned run container removed';
    } catch {
      return `orphaned run container NOT removed — docker rm -f ${rmArgv.at(-1)}`;
    }
  }

  /**
   * Execute a run verb with concurrency limits. Playwright verbs run via `exec`
   * in the sleeping container — ensured up (idempotent, heals config drift)
   * first, so a cold stack warms itself instead of failing with "service is
   * not running". An optional `file` (test|e2e only) narrows the run to one
   * spec — resolved by set membership against the discovered spec list
   * (specs.ts), so only real spec paths ever reach the plan table.
   */
  async function execRun(
    verb: RunVerb,
    file?: string,
  ): Promise<{ result: ExecResult; note: string }> {
    if (file && verb !== 'test' && verb !== 'e2e') {
      throw new Error(`file is only valid for the test and e2e verbs, not '${verb}'`);
    }
    const spec = file
      ? resolveSpec(file, await discover(), verb === 'e2e' ? 'e2e' : 'test')
      : undefined;
    const isPlaywright = spec ? spec.kind === 'e2e' : verb === 'e2e' || verb === 'screenshot';

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
      const result = await exec(spec ? planSpec(runId, spec) : planRun(verb, runId));
      // name the resolved spec in the verdict — a suffix-matched `plan.spec.ts`
      // should show what actually ran
      const note = spec ? `spec ${spec.path}` : '';
      if (!result.timedOut) {
        return { result, note };
      }
      const rmArgv = spec ? planSpecRm(runId) : planRm(verb, runId);
      const reaped = await reap(isPlaywright, rmArgv);
      return { result, note: note ? `${note}; ${reaped}` : reaped };
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
      // Name slot and transcript in the verdict — the conductor should never
      // have to guess which agent log served a run.
      const transcript = `transcript logs/agent-${slot}.log`;
      note = note ? `${note}; ${transcript}` : transcript;
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

  /**
   * Format in place — `vp fmt` exec'd into the agent container, the only rw
   * mount of the tree (the run verbs stay read-only by design). Takes no
   * agent slot: the exec is its own process and every replica shares the
   * mount. A timed-out fmt is reported but NOT reaped — restarting the
   * container would kill any agent run living in it.
   */
  async function execFmt(worktree?: string): Promise<{ result: ExecResult; note: string }> {
    const up = await exec(planAgentUp());
    if (up.code !== 0) {
      return { result: up, note: 'compose up -d agent failed' };
    }
    const workdir = worktree ? agentWorktree(worktree).path : undefined;
    const result = await exec(planFmt(workdir), { timeoutMs: FMT_TIMEOUT_MS });
    const target = workdir ? `formatted ${workdir}` : '';
    if (!result.timedOut) {
      return { result, note: target };
    }
    return {
      result,
      note: `${target ? `${target}; ` : ''}timed-out fmt NOT reaped — a container restart would kill agent runs`,
    };
  }

  return { execRun, execAgent, execFmt };
}
