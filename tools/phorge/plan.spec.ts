import { describe, it, expect } from 'vite-plus/test';
import {
  planRun,
  planRm,
  planAgy,
  planClaude,
  planAgentUp,
  planAgentRestart,
  planAgyModels,
  planWorktreeCheck,
  planWorktreeAdd,
  COMPOSE_AGENTS,
  getAgentContainer,
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

  it('plans agy as a plain docker exec (stdin closed) with the prompt as one inert argv', () => {
    const hostile = 'run lint; $(rm -rf /) `evil` && echo pwned';
    const argv = planAgy(1, hostile, 'Gemini 3.1 Pro (High)');
    // plain `docker exec` on the pinned container name — compose exec keeps
    // stdin open and stalls the CLIs; without -i it is closed.
    expect(argv.slice(0, 2)).toEqual(['exec', getAgentContainer(1)]);
    expect(argv).not.toContain('-i');
    expect(argv).toContain('--dangerously-skip-permissions'); // container wall is the boundary
    expect(argv).toContain('--model');
    expect(argv).toContain('Gemini 3.1 Pro (High)');
    // The prompt stays ONE argv element — metacharacters never meet a shell.
    expect(argv.at(-1)).toBe(hostile);
    expect(argv.at(-2)).toBe('-p');
  });

  it('plans claude in the same yolo mode, prompt directly after -p', () => {
    const argv = planClaude(2, 'call phorge status', 'sonnet');
    expect(argv.slice(0, 2)).toEqual(['exec', getAgentContainer(2)]);
    expect(argv[argv.indexOf('-p') + 1]).toBe('call phorge status');
    // Yolo like agy — IS_SANDBOX=1 in compose.agents.yml lifts claude's
    // as-root refusal; the container wall is the permission boundary.
    expect(argv).toContain('--dangerously-skip-permissions');
    expect(argv).toContain('--strict-mcp-config'); // repo .mcp.json stdio entry cannot work in-container
    expect(argv).toContain('/root/.claude-phorge-mcp.json');
    // situational awareness: the yolo rules live in AGENTS.md, versioned
    expect(argv[argv.indexOf('--append-system-prompt') + 1]).toContain('AGENTS.md');
    expect(argv[argv.indexOf('--model') + 1]).toBe('sonnet');
  });

  it('plans task worktrees: check, add, and exec -w into the workdir', () => {
    expect(planWorktreeCheck(1, 'fix-foo')).toEqual([
      'exec',
      getAgentContainer(1),
      'test',
      '-d',
      '/phlame/.worktrees/fix-foo',
    ]);
    const add = planWorktreeAdd(2, 'fix-foo');
    expect(add).toContain('worktree');
    expect(add).toContain('agent/fix-foo');
    expect(add.at(-1)).toBe('/phlame/.worktrees/fix-foo');
    // the run itself starts INSIDE the worktree
    const argv = planClaude(1, 'do it', undefined, '/phlame/.worktrees/fix-foo');
    expect(argv.slice(0, 3)).toEqual(['exec', '-w', '/phlame/.worktrees/fix-foo']);
    // cwd alone is ignored by discovery-happy CLIs (a Flash run strayed into
    // /phlame) — the worktree must be named in the prompt itself, for both CLIs
    const claudePrompt = argv[argv.indexOf('-p') + 1];
    expect(claudePrompt).toContain('/phlame/.worktrees/fix-foo');
    expect(claudePrompt).toContain('agent/fix-foo');
    expect(claudePrompt.endsWith('do it')).toBe(true);
    const agy = planAgy(1, 'do it', undefined, '/phlame/.worktrees/fix-foo');
    const agyPrompt = agy[agy.indexOf('-p') + 1];
    expect(agyPrompt).toContain('agent/fix-foo');
    expect(agyPrompt.endsWith('do it')).toBe(true);
    // without a worktree the prompt stays verbatim
    expect(planAgy(1, 'just a question').at(-1)).toBe('just a question');
  });

  it('plans agent warm-up, restart and model listing', () => {
    expect(planAgentUp()).toEqual(['compose', '-f', COMPOSE_AGENTS, 'up', '-d', 'agent']);
    // plain docker verb — the executor prepends `docker` itself (a leading
    // 'docker' element would spawn `docker docker restart`)
    expect(planAgentRestart(2)).toEqual(['restart', getAgentContainer(2)]);
    expect(planAgyModels()).toEqual(['exec', getAgentContainer(1), 'agy', 'models']);
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
