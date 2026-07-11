/**
 * Phorge verb table (PLAN-CONTAINERS): pure functions mapping the closed verb
 * vocabulary to docker argv arrays. Every command is spawned as `docker <argv>`
 * with shell:false on the host, so metacharacters are inert. One documented
 * exception: the test/lint plans chain two steps via `sh -c '<constant>'` INSIDE
 * the disposable runner — the string is a compile-time constant from this closed
 * table, never interpolated; revisit (split into sequential argv steps) if a
 * step ever becomes dynamic.
 * Pattern adapted from Hyphe's orchestrate plan.ts (argv tables, TDD without Docker).
 */

export const COMPOSE_FILE = 'compose.test.yml';
export const DEV_OVERLAY = 'compose.test.dev.yml';
export const COMPOSE_AGENTS = 'compose.agents.yml';

/** run verbs execute in the ephemeral runners WITH the dev overlay (live source) */
const composeDev = ['compose', '-f', COMPOSE_FILE, '-f', DEV_OVERLAY] as const;
/** stack-level verbs (logs/ps/down) address the project without the overlay */
const composeBase = ['compose', '-f', COMPOSE_FILE] as const;

export const RUN_VERBS = ['test', 'tsc', 'lint', 'e2e', 'screenshot'] as const;
export type RunVerb = (typeof RUN_VERBS)[number];

export const SERVICES = ['phlame', 'runner', 'playwright'] as const;
export type Service = (typeof SERVICES)[number];

const RUN_PLANS: Record<RunVerb, string[]> = {
  test: ['runner', 'sh', '-c', 'npx vitest run && cd engine && npx vitest run'],
  tsc: ['runner', 'npx', 'tsc', '-p', 'tsconfig.spec.json', '--noEmit'],
  // Vite+ tooling: `vp lint` wraps oxlint but does NOT auto-discover .oxlintrc.json
  // (the file stays canonical — CI's standalone fast-fail oxlint reads it), so pass
  // it via -c. `vp fmt` is --check only: the dev overlay mounts source read-only, so
  // the container verifies formatting (options live in vite.config.ts `fmt`),
  // writing happens host-side while editing. Both stages always run (`;`), but each
  // failure still fails the verb: a bare `;` would report only the LAST exit code,
  // letting a green format check mask red lint.
  lint: [
    'runner',
    'sh',
    '-c',
    'npx vp lint -c .oxlintrc.json; l=$?; npx vp fmt --check; f=$?; exit $((l || f))',
  ],
  e2e: ['playwright', 'npx', 'playwright', 'test'],
  screenshot: [
    'playwright',
    'npx',
    'playwright',
    'test',
    'screenshot.spec.ts',
    '--project=chromium',
  ],
};

/**
 * Deterministic one-off container name for a specific run execution. Killing a
 * timed-out `docker compose run` kills only the CLI client — the container
 * survives in the daemon; the unique name makes the orphan addressable for
 * `docker rm -f` (planRm). The unique id enables concurrent runs without name
 * conflicts.
 */
export function runContainerName(verb: RunVerb, runId: string): string {
  return `phorge-${verb}-${runId}`;
}

export function planRun(verb: RunVerb, runId: string): string[] {
  const plan = RUN_PLANS[verb];
  if (!plan) {
    throw new Error(`Unknown verb: ${verb} (known: ${RUN_VERBS.join(', ')})`);
  }

  // NO_COLOR: verdicts are read by agents, not terminals — kill the ANSI noise
  // at the source (vitest/playwright/eslint all honor it).
  const noColor = ['-e', 'NO_COLOR=1'] as const;
  if (verb === 'e2e' || verb === 'screenshot') {
    // Playwright is a sleeping container, execute inside the running service.
    // plan is [service, ...command]
    const [service, ...cmd] = plan;
    return [...composeDev, 'exec', ...noColor, service, ...cmd];
  } else {
    // Runner is ephemeral, spin up a new named container.
    return [
      ...composeDev,
      'run',
      '--rm',
      '--name',
      runContainerName(verb, runId),
      ...noColor,
      ...plan,
    ];
  }
}

/** Reap the orphaned run container after a timeout kill (plain docker, not compose). */
export function planRm(verb: RunVerb, runId: string): string[] {
  if (verb === 'e2e' || verb === 'screenshot') {
    return []; // No container to reap for 'exec' — that orphan needs planRestart
  }
  return ['rm', '-f', runContainerName(verb, runId)];
}

/**
 * Idempotent warm-up for the exec verbs: `up -d` starts the sleeping playwright
 * service (and its phlame dependency, gated on its healthcheck) when the stack is
 * cold, and is a fast no-op when warm. Uses the dev overlay so the mounts are live
 * source; compose recreates a running container whose config drifted (e.g. started
 * without the overlay), so a stale container heals here instead of silently
 * testing baked source.
 */
export function planUp(service: Service): string[] {
  return [...composeDev, 'up', '-d', service];
}

/**
 * Reap a timed-out exec: killing the docker CLI client leaves the test process
 * running inside the sleeping container — restarting the service is what
 * actually ends it.
 */
export function planRestart(service: Service): string[] {
  return [...composeBase, 'restart', service];
}

export function planLogs(service: Service, tail: number): string[] {
  if (!SERVICES.includes(service)) {
    throw new Error(`Unknown service: ${service} (known: ${SERVICES.join(', ')})`);
  }
  // clamp to a sane window — logs are a probe, not a dump
  const lines = Math.min(Math.max(Math.trunc(tail) || 50, 1), 500);
  return [...composeBase, 'logs', '--no-color', '--tail', String(lines), service];
}

/** agent-stack verbs address the agents compose project (sleeping `agent` service) */
const composeAgents = ['compose', '-f', COMPOSE_AGENTS] as const;

/**
 * Deterministic: the project name is pinned (`name: phlame-agents`) and the
 * replicas (compose `deploy.replicas`) are numbered — slot N is container
 * `…-agent-N`. Agent prompts exec via plain `docker exec` (not compose exec)
 * on purpose: without -i stdin is CLOSED — compose exec keeps it open and
 * claude then stalls 3s "waiting for stdin" on every run.
 */
export function getAgentContainer(slot: number): string {
  return `phlame-agents-agent-${slot}`;
}

/**
 * One line of situational awareness for claude (agy picks AGENTS.md up on its
 * own) — the actual rules live in /phlame/AGENTS.md, versioned and reviewable.
 */
const CLAUDE_SYSTEM_PROMPT =
  'You run headless inside the phlame agent container in yolo mode. Read /phlame/AGENTS.md first and obey it.';

/**
 * Idempotent warm-up for the agent container. Its start command runs
 * tools/agent/setup.sh (agy MCP config from env, credential seeding), so a
 * cold container comes up ready for the agy verb.
 */
export function planAgentUp(): string[] {
  return [...composeAgents, 'up', '-d', 'agent'];
}

/**
 * Headless agy prompt inside the agent container. The prompt is ONE argv
 * element handed to `agy -p` — data for the LLM, inert for a shell (spawned
 * shell:false end to end, like every plan here). The
 * --dangerously-skip-permissions is deliberate and container-scoped: inside
 * the agent container the container wall is the permission boundary
 * (PLAN-CONTAINERS O2); the same flag on a host agy would be reckless.
 */
export function planAgy(slot: number, prompt: string, model?: string, workdir?: string): string[] {
  const args = ['exec'];
  if (workdir) {
    args.push('-w', workdir);
  }
  args.push(getAgentContainer(slot), 'agy', '--dangerously-skip-permissions');
  if (model) {
    args.push('--model', model);
  }
  args.push('-p', prompt);
  return args;
}

/**
 * Headless claude prompt inside the agent container — same yolo mode as agy
 * (--dangerously-skip-permissions; claude refuses it as root unless
 * IS_SANDBOX=1, which compose.agents.yml sets deliberately — the container
 * wall is the boundary). --strict-mcp-config skips the repo .mcp.json, whose
 * stdio phorge entry cannot work behind the wall; tools/agent/setup.sh
 * generates the HTTP config at container start. The prompt stays directly
 * after -p by convention (some claude flags are variadic and would swallow a
 * trailing prompt).
 */
export function planClaude(
  slot: number,
  prompt: string,
  model?: string,
  workdir?: string,
): string[] {
  const args = ['exec'];
  if (workdir) {
    args.push('-w', workdir);
  }
  args.push(
    getAgentContainer(slot),
    'claude',
    '-p',
    prompt,
    '--dangerously-skip-permissions',
    '--strict-mcp-config',
    '--mcp-config',
    '/root/.claude-phorge-mcp.json',
    '--append-system-prompt',
    CLAUDE_SYSTEM_PROMPT,
  );
  if (model) {
    args.push('--model', model);
  }
  return args;
}

/** List agy's selectable models (read-only, no yolo flag needed). */
export function planAgyModels(): string[] {
  return ['exec', getAgentContainer(1), 'agy', 'models'];
}

/**
 * Task worktrees — the COLLECT mechanism for agent runs: the agent works in
 * /phlame/.worktrees/<slug> on branch agent/<slug>; the shared .git makes
 * every commit instantly visible on the host, where the conductor reviews
 * (`git diff <base>...agent/<slug>`), merges, and removes the worktree.
 * Repeat dispatches with the same slug reuse worktree + branch, so commits
 * accumulate across runs. The slug feeds a PATH and a BRANCH — callers
 * validate it (tools.ts zod regex) before it reaches this table.
 */
export const WORKTREES_DIR = '/phlame/.worktrees';

export function agentWorktree(slug: string): { path: string; branch: string } {
  return { path: `${WORKTREES_DIR}/${slug}`, branch: `agent/${slug}` };
}

export function planWorktreeCheck(slot: number, slug: string): string[] {
  return ['exec', getAgentContainer(slot), 'test', '-d', agentWorktree(slug).path];
}

export function planWorktreeAdd(slot: number, slug: string): string[] {
  const { path, branch } = agentWorktree(slug);
  return [
    'exec',
    getAgentContainer(slot),
    'git',
    '-C',
    '/phlame',
    'worktree',
    'add',
    '-b',
    branch,
    path,
  ];
}

/**
 * Reap a timed-out agent exec — same hole as the playwright exec verbs: killing
 * the docker CLI client leaves the agent running inside the sleeping container.
 */
export function planAgentRestart(slot: number = 1): string[] {
  // plain docker verb — the executor prepends `docker` itself
  return ['restart', getAgentContainer(slot)];
}

export function planPs(): string[] {
  return [...composeBase, 'ps', '--all'];
}

export function planBuild(): string[] {
  return [...composeBase, 'build'];
}

export function planDown(): string[] {
  return [...composeBase, 'down'];
}
