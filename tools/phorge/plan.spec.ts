import { describe, it, expect } from 'vitest';
import {
  planRun,
  planRm,
  planLogs,
  planPs,
  planBuild,
  planDown,
  runContainerName,
  RUN_VERBS,
  COMPOSE_FILE,
  DEV_OVERLAY,
  type RunVerb,
  type Service,
} from './plan';

describe('phorge verb table', () => {
  it('plans every run verb as a named compose run with the dev overlay', () => {
    for (const verb of RUN_VERBS) {
      const argv = planRun(verb);
      expect(argv.slice(0, 5)).toEqual(['compose', '-f', COMPOSE_FILE, '-f', DEV_OVERLAY]);
      expect(argv.slice(5, 9)).toEqual(['run', '--rm', '--name', runContainerName(verb)]);
    }
  });

  it('reaps the matching named container after a timeout', () => {
    for (const verb of RUN_VERBS) {
      expect(planRm(verb)).toEqual(['rm', '-f', runContainerName(verb)]);
      expect(planRun(verb)).toContain(runContainerName(verb));
    }
  });

  it('maps test/tsc/lint to the runner and e2e/screenshot to playwright', () => {
    expect(planRun('test')).toContain('runner');
    expect(planRun('tsc')).toContain('runner');
    expect(planRun('lint')).toContain('runner');
    expect(planRun('e2e')).toContain('playwright');
    expect(planRun('screenshot')).toContain('playwright');
  });

  it('screenshot runs only the screenshot spec on chromium', () => {
    const argv = planRun('screenshot');
    expect(argv).toContain('screenshot.spec.ts');
    expect(argv).toContain('--project=chromium');
  });

  it('rejects unknown verbs, naming the known ones', () => {
    expect(() => planRun('deploy' as RunVerb)).toThrow(/Unknown verb: deploy.*test.*screenshot/);
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
