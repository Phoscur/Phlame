import { describe, it, expect } from 'vite-plus/test';
import { createRunner, type Exec } from './run';
import type { ExecResult } from './exec';

/** Scripted executor: records every argv, answers by matching a keyword. */
function scriptedExec(script: (argv: string[]) => Partial<ExecResult> | undefined) {
  const calls: string[][] = [];
  const exec: Exec = async (argv) => {
    calls.push(argv);
    return { code: 0, output: '', truncated: false, timedOut: false, ...script(argv) };
  };
  return { exec, calls };
}

describe('phorge runner orchestration', () => {
  it('runs a runner verb as a single plan — no warm-up, no reap', async () => {
    const { exec, calls } = scriptedExec(() => undefined);
    const { execRun } = createRunner(exec);
    const { result, note } = await execRun('test');
    expect(result.code).toBe(0);
    expect(note).toBe('');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('runner');
  });

  it('ensures the sleeping service is up before an exec verb', async () => {
    const { exec, calls } = scriptedExec(() => undefined);
    const { execRun } = createRunner(exec);
    await execRun('e2e');
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('up');
    expect(calls[0]).toContain('playwright');
    expect(calls[1]).toContain('exec');
  });

  it('short-circuits when the warm-up fails', async () => {
    const { exec, calls } = scriptedExec((argv) =>
      argv.includes('up') ? { code: 1, output: 'boom' } : undefined,
    );
    const { execRun } = createRunner(exec);
    const { result, note } = await execRun('screenshot');
    expect(result.code).toBe(1);
    expect(note).toContain('up -d playwright failed');
    expect(calls).toHaveLength(1); // the test never ran
  });

  it('reaps the named container when a runner verb times out', async () => {
    const { exec, calls } = scriptedExec((argv) =>
      argv.includes('run') ? { timedOut: true, code: -1 } : undefined,
    );
    const { execRun } = createRunner(exec);
    const { note } = await execRun('lint');
    expect(note).toBe('orphaned run container removed');
    const name = calls[0][calls[0].indexOf('--name') + 1];
    expect(calls[1]).toEqual(['rm', '-f', name]);
  });

  it('restarts playwright when an exec verb times out', async () => {
    const { exec, calls } = scriptedExec((argv) =>
      argv.includes('exec') ? { timedOut: true, code: -1 } : undefined,
    );
    const { execRun } = createRunner(exec);
    const { note } = await execRun('e2e');
    expect(note).toContain('playwright restarted');
    expect(calls[2]).toContain('restart');
  });

  it('reports a failed reap instead of hiding it', async () => {
    const exec: Exec = async (argv) => {
      if (argv.includes('rm')) throw new Error('daemon gone');
      return { code: -1, output: '', truncated: false, timedOut: true };
    };
    const { execRun } = createRunner(exec);
    const { note } = await execRun('test');
    expect(note).toContain('NOT removed');
  });

  it('rejects beyond the playwright concurrency limit and frees the slot after', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const exec: Exec = async (argv) => {
      if (argv.includes('exec')) await gate;
      return { code: 0, output: '', truncated: false, timedOut: false };
    };
    const { execRun } = createRunner(exec);
    const first = execRun('e2e');
    await expect(execRun('screenshot')).rejects.toThrow(/Max concurrency.*Playwright/);
    release();
    await first;
    await expect(execRun('screenshot')).resolves.toMatchObject({ note: '' });
  });

  it('runs a single vitest spec in the runner pool and names it in the note', async () => {
    const discover = async () => ({
      app: ['tools/phorge/plan.spec.ts'],
      engine: ['engine/src/index.spec.ts'],
      e2e: ['tests/build.spec.ts'],
    });
    const { exec, calls } = scriptedExec(() => undefined);
    const { execRun } = createRunner(exec, discover);
    // suffix match resolves to the full path; the note says what actually ran
    const { note } = await execRun('test', 'plan.spec.ts');
    expect(note).toBe('spec tools/phorge/plan.spec.ts');
    expect(calls).toHaveLength(1); // runner path: no warm-up
    expect(calls[0]).toContain('vitest');
    expect(calls[0]).toContain('tools/phorge/plan.spec.ts');
    // e2e spec goes through the playwright path: warm-up + exec
    const { note: e2eNote } = await execRun('e2e', 'build.spec.ts');
    expect(e2eNote).toBe('spec tests/build.spec.ts');
    expect(calls[1]).toContain('up');
    expect(calls[2]).toContain('exec');
  });

  it('rejects file on non-test verbs and unknown specs before anything runs', async () => {
    const discover = async () => ({ app: ['src/a.spec.ts'], engine: [], e2e: [] });
    const { exec, calls } = scriptedExec(() => undefined);
    const { execRun } = createRunner(exec, discover);
    await expect(execRun('lint', 'src/a.spec.ts')).rejects.toThrow(/only valid for/);
    await expect(execRun('test', 'nope.spec.ts')).rejects.toThrow(/known: src\/a\.spec\.ts/);
    expect(calls).toHaveLength(0); // nothing was executed
  });

  it('reaps a timed-out single spec via its own container name', async () => {
    const discover = async () => ({ app: ['src/a.spec.ts'], engine: [], e2e: [] });
    const { exec, calls } = scriptedExec((argv) =>
      argv.includes('vitest') ? { timedOut: true, code: -1 } : undefined,
    );
    const { execRun } = createRunner(exec, discover);
    const { note } = await execRun('test', 'src/a.spec.ts');
    expect(note).toContain('spec src/a.spec.ts');
    expect(note).toContain('orphaned run container removed');
    const name = calls[0][calls[0].indexOf('--name') + 1];
    expect(calls[1]).toEqual(['rm', '-f', name]);
  });

  it('ensures the agent is up before an agent run', async () => {
    const { exec, calls } = scriptedExec(() => undefined);
    const { execAgent } = createRunner(exec);
    const { result, note } = await execAgent('agy', 'say hi');
    expect(result.code).toBe(0);
    // the verdict names the transcript, so the conductor never hunts for it
    expect(note).toBe('transcript logs/agent-1.log');
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('up');
    expect(calls[0]).toContain('agent');
    expect(calls[1]).toContain('agy');
    // agy carries its preamble in the prompt; the task text stays at the end
    expect(calls[1].at(-1)!.endsWith('say hi')).toBe(true);
  });

  it('restarts the agent when an agent run times out', async () => {
    const { exec, calls } = scriptedExec((argv) =>
      argv.includes('agy') ? { timedOut: true, code: -1 } : undefined,
    );
    const { execAgent } = createRunner(exec);
    const { note } = await execAgent('agy', 'hang forever');
    expect(note).toContain('agent restarted');
    expect(note).toContain('agy');
    expect(calls[2]).toContain('restart');
  });

  it('agy and claude share the agent slot pool across distinct replicas', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const agentCalls: string[][] = [];
    const exec: Exec = async (argv) => {
      if (argv.includes('agy') || argv.includes('claude')) {
        agentCalls.push(argv);
        await gate;
      }
      return { code: 0, output: '', truncated: false, timedOut: false };
    };
    const { execAgent } = createRunner(exec);
    const first = execAgent('agy', 'one');
    const second = execAgent('claude', 'two');
    // third parallel run exceeds the pool (MAX_AGENT_CONCURRENCY replicas)
    await expect(execAgent('claude', 'three')).rejects.toThrow(/Max concurrency.*agent container/);
    release();
    await Promise.all([first, second]);
    // the two parallel runs landed on DIFFERENT replica containers
    const containers = agentCalls.map((argv) => argv[argv.indexOf('exec') + 1]);
    expect(new Set(containers).size).toBe(2);
    // a freed slot is reusable
    const fourth = await execAgent('claude', 'four');
    expect(fourth.note).toMatch(/^transcript logs\/agent-[12]\.log$/);
  });

  it('creates the task worktree on first use and reuses it after', async () => {
    let worktreeExists = false;
    const { exec, calls } = scriptedExec((argv) => {
      if (argv.includes('test')) return worktreeExists ? undefined : { code: 1 };
      if (argv.includes('worktree')) {
        worktreeExists = true;
        return undefined;
      }
      return undefined;
    });
    const { execAgent } = createRunner(exec);

    const first = await execAgent('claude', 'slice one', undefined, 'fix-foo');
    expect(first.note).toContain('created');
    const addCall = calls.find((argv) => argv.includes('worktree'));
    expect(addCall).toContain('agent/fix-foo');
    const runCall = calls.find((argv) => argv.includes('claude'));
    expect(runCall!.slice(0, 3)).toEqual(['exec', '-w', '/phlame/.worktrees/fix-foo']);

    const second = await execAgent('claude', 'slice two', undefined, 'fix-foo');
    expect(second.note).toContain('reused');
    expect(calls.filter((argv) => argv.includes('worktree'))).toHaveLength(1);
  });

  it('warms the agent container before fmt and names a worktree target in the note', async () => {
    const { exec, calls } = scriptedExec(() => undefined);
    const { execFmt } = createRunner(exec);
    const plain = await execFmt();
    expect(plain.result.code).toBe(0);
    expect(plain.note).toBe('');
    expect(calls[0]).toContain('up');
    expect(calls[0]).toContain('agent');
    expect(calls[1]).toContain('fmt');
    expect(calls[1][calls[1].indexOf('-w') + 1]).toBe('/phlame');

    const scoped = await execFmt('fix-foo');
    expect(scoped.note).toContain('/phlame/.worktrees/fix-foo');
    expect(calls[3][calls[3].indexOf('-w') + 1]).toBe('/phlame/.worktrees/fix-foo');
  });

  it('reports a timed-out fmt but does not reap — a restart would kill agent runs', async () => {
    const { exec, calls } = scriptedExec((argv) =>
      argv.includes('fmt') ? { timedOut: true, code: -1 } : undefined,
    );
    const { execFmt } = createRunner(exec);
    const { note } = await execFmt();
    expect(note).toContain('NOT reaped');
    expect(calls.some((argv) => argv.includes('restart'))).toBe(false);
  });

  it('pools runner and playwright separately', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const exec: Exec = async (argv) => {
      if (argv.includes('exec')) await gate;
      return { code: 0, output: '', truncated: false, timedOut: false };
    };
    const { execRun } = createRunner(exec);
    const blocked = execRun('e2e');
    await expect(execRun('tsc')).resolves.toMatchObject({ note: '' });
    release();
    await blocked;
  });
});
