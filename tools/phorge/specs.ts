import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Spec discovery — the structural answer to "run a single test" without
 * reopening the free-form door: the `file` argument is validated by SET
 * MEMBERSHIP in the enumerated spec files of the working tree (Hyphe's
 * resolve.ts idea applied to tests), not by a regex over a command string.
 * Injection is already dead (argv, shell:false); what this check buys is
 * scope — no `../..`, no extra flags, no invented paths.
 */

export type SpecKind = 'app' | 'engine' | 'e2e';

export interface ResolvedSpec {
  kind: SpecKind;
  /** repo-relative, forward slashes — exactly as discovered */
  path: string;
}

export interface SpecList {
  /** root vitest suite: src/** and tools/** (vite.config.ts include) */
  app: string[];
  /** engine suite, run from /phlame/engine */
  engine: string[];
  /** playwright suite: tests/* */
  e2e: string[];
}

const SPEC_PATTERN = /\.spec\.tsx?$/;

async function scan(root: string, dir: string): Promise<string[]> {
  const entries = await readdir(join(root, dir), { recursive: true });
  return entries
    .map((entry) => `${dir}/${String(entry).replaceAll('\\', '/')}`)
    .filter((path) => SPEC_PATTERN.test(path) && !path.includes('node_modules'));
}

/** Enumerate every spec file the suites can run — the closed set `file` resolves against. */
export async function listSpecs(
  root: string = process.env.PHLAME_WORKTREE ?? '.',
): Promise<SpecList> {
  const [src, tools, engine, e2e] = await Promise.all([
    scan(root, 'src'),
    scan(root, 'tools'),
    scan(root, 'engine/src'),
    scan(root, 'tests'),
  ]);
  return { app: [...src, ...tools].sort(), engine: engine.sort(), e2e: e2e.sort() };
}

/**
 * Resolve a user-supplied file against the discovered set. Exact path first,
 * then unique suffix (so a bare `plan.spec.ts` works); anything else fails
 * loudly WITH the candidate list — the error doubles as discovery.
 */
export function resolveSpec(file: string, specs: SpecList, scope: 'test' | 'e2e'): ResolvedSpec {
  const normalized = file.replaceAll('\\', '/').replace(/^\.\//, '');
  const pools: [SpecKind, string[]][] =
    scope === 'e2e'
      ? [['e2e', specs.e2e]]
      : [
          ['app', specs.app],
          ['engine', specs.engine],
        ];

  for (const [kind, list] of pools) {
    if (list.includes(normalized)) return { kind, path: normalized };
  }

  const matches = pools.flatMap(([kind, list]) =>
    list.filter((path) => path.endsWith(`/${normalized}`)).map((path) => ({ kind, path })),
  );
  if (matches.length === 1) return matches[0];

  const known = pools.flatMap(([, list]) => list);
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous spec '${file}' — candidates: ${matches.map((m) => m.path).join(', ')}`,
    );
  }
  throw new Error(`Unknown ${scope} spec '${file}' — known: ${known.join(', ')}`);
}
