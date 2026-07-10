/**
 * Phorge verb table (PLAN-CONTAINERS): pure functions mapping the closed verb
 * vocabulary to docker argv arrays. No shell strings anywhere — every command is
 * spawned as `docker <argv>` with shell:false, so metacharacters are inert.
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
  test: ['runner', 'npm', 'test'],
  tsc: ['runner', 'npm', 'run', 'tsc'],
  lint: ['runner', 'npm', 'run', 'lint'],
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
 * Deterministic one-off container name. Killing a timed-out `docker compose run`
 * kills only the CLI client — the container survives in the daemon; the name makes
 * the orphan addressable for `docker rm -f` (planRm). Side effect accepted: two
 * concurrent runs of the same verb fail fast on the name conflict instead of racing.
 */
export function runContainerName(verb: RunVerb): string {
  return `phorge-${verb}`;
}

export function planRun(verb: RunVerb): string[] {
  const plan = RUN_PLANS[verb];
  if (!plan) {
    throw new Error(`Unknown verb: ${verb} (known: ${RUN_VERBS.join(', ')})`);
  }
  return [...composeDev, 'run', '--rm', '--name', runContainerName(verb), ...plan];
}

/** Reap the orphaned run container after a timeout kill (plain docker, not compose). */
export function planRm(verb: RunVerb): string[] {
  return ['rm', '-f', runContainerName(verb)];
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
