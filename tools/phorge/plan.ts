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
  // prettier is --check only: the dev overlay mounts source read-only, so the
  // container verifies formatting, writing happens host-side while editing. The
  // scope is the mounted dirs — everything else in the container is baked (stale).
  // Both stages always run (`;`), but each failure still fails the verb: a bare
  // `;` would report only the LAST exit code, letting green prettier mask red eslint.
  lint: [
    'runner',
    'sh',
    '-c',
    'npx oxlint && npx eslint; l=$?; npx prettier --check src engine/src tools tests; p=$?; exit $((l || p))',
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

export function planPs(): string[] {
  return [...composeBase, 'ps', '--all'];
}

export function planBuild(): string[] {
  return [...composeBase, 'build'];
}

export function planDown(): string[] {
  return [...composeBase, 'down'];
}
