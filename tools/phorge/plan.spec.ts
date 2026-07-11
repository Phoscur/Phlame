import { describe, it, expect } from 'vite-plus/test';
import {
  planRun,
  planRm,
  planUp,
  planRestart,
  planLogs,
  planPs,
  planBuild,
  planDown,
  runContainerName,
  COMPOSE_FILE,
  DEV_OVERLAY,
  type RunVerb,
  type Service,
} from './plan';

describe('phorge verb table', () => {
  const runId = 'test1234';

  it('plans runner verbs as named, uncolored compose run with the dev overlay', () => {
    for (const verb of ['test', 'tsc', 'lint'] as const) {
      const argv = planRun(verb, runId);
      expect(argv.slice(0, 5)).toEqual(['compose', '-f', COMPOSE_FILE, '-f', DEV_OVERLAY]);
      expect(argv.slice(5, 11)).toEqual([
        'run',
        '--rm',
        '--name',
        runContainerName(verb, runId),
        '-e',
        'NO_COLOR=1',
      ]);
    }
  });

  it('plans playwright verbs as uncolored compose exec with the dev overlay', () => {
    for (const verb of ['e2e', 'screenshot'] as const) {
      const argv = planRun(verb, runId);
      expect(argv.slice(0, 5)).toEqual(['compose', '-f', COMPOSE_FILE, '-f', DEV_OVERLAY]);
      expect(argv.slice(5, 9)).toEqual(['exec', '-e', 'NO_COLOR=1', 'playwright']);
    }
  });

  it('warms the sleeping service with the dev overlay and restarts it to reap', () => {
    expect(planUp('playwright')).toEqual([
      'compose',
      '-f',
      COMPOSE_FILE,
      '-f',
      DEV_OVERLAY,
      'up',
      '-d',
      'playwright',
    ]);
    expect(planRestart('playwright')).toEqual([
      'compose',
      '-f',
      COMPOSE_FILE,
      'restart',
      'playwright',
    ]);
  });

  it('reaps the matching named container after a timeout for runner verbs only', () => {
    for (const verb of ['test', 'tsc', 'lint'] as const) {
      expect(planRm(verb, runId)).toEqual(['rm', '-f', runContainerName(verb, runId)]);
      expect(planRun(verb, runId)).toContain(runContainerName(verb, runId));
    }
    for (const verb of ['e2e', 'screenshot'] as const) {
      expect(planRm(verb, runId)).toEqual([]);
    }
  });

  it('maps test/tsc/lint to the runner and e2e/screenshot to playwright', () => {
    expect(planRun('test', runId)).toContain('runner');
    expect(planRun('tsc', runId)).toContain('runner');
    expect(planRun('lint', runId)).toContain('runner');
    expect(planRun('e2e', runId)).toContain('playwright');
    expect(planRun('screenshot', runId)).toContain('playwright');
  });

  it('lint chains the format check (read-only mounts: check, never write)', () => {
    expect(planRun('lint', runId).at(-1)).toContain('vp fmt --check');
  });

  it('screenshot runs only the screenshot spec on chromium', () => {
    const argv = planRun('screenshot', runId);
    expect(argv).toContain('screenshot.spec.ts');
    expect(argv).toContain('--project=chromium');
  });

  it('rejects unknown verbs, naming the known ones', () => {
    expect(() => planRun('deploy' as RunVerb, runId)).toThrow(
      /Unknown verb: deploy.*test.*screenshot/,
    );
  });

  it('plans logs without the dev overlay, clamped and uncolored', () => {
    expect(planLogs('phlame', 50)).toEqual([
      'compose',
      '-f',
      COMPOSE_FILE,
      'logs',
      '--no-color',
      '--tail',
      '50',
      'phlame',
    ]);
    expect(planLogs('runner', 0)).toContain('50'); // falsy tail → default
    expect(planLogs('runner', -5)).toContain('1'); // clamp floor
    expect(planLogs('runner', 99999)).toContain('500'); // clamp ceiling
    expect(planLogs('runner', 7.9)).toContain('7'); // integers only
  });

  it('rejects unknown services', () => {
    expect(() => planLogs('app' as Service, 10)).toThrow(/Unknown service: app/);
  });

  it('plans stack verbs on the base file only', () => {
    for (const argv of [planPs(), planBuild(), planDown()]) {
      expect(argv.slice(0, 3)).toEqual(['compose', '-f', COMPOSE_FILE]);
      expect(argv).not.toContain(DEV_OVERLAY);
    }
    expect(planPs()).toContain('--all');
    expect(planBuild()).toContain('build');
    expect(planDown()).toContain('down');
  });
});
