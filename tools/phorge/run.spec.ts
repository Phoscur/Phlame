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

  it('ensures the agent is up before an agent run', async () => {
    const { exec, calls } = scriptedExec(() => undefined);
    const { execAgent } = createRunner(exec);
    const { result, note } = await execAgent('agy', 'say hi');
    expect(result.code).toBe(0);
    expect(note).toBe('');
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('up');
    expect(calls[0]).toContain('agent');
    expect(calls[1]).toContain('agy');
    expect(calls[1].at(-1)).toBe('say hi');
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

  it('agy and claude share the single agent slot', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const exec: Exec = async (argv) => {
      if (argv.includes('agy')) await gate;
      return { code: 0, output: '', truncated: false, timedOut: false };
    };
    const { execAgent } = createRunner(exec);
    const first = execAgent('agy', 'one');
    // the OTHER cli is rejected too — same container, same slot
    await expect(execAgent('claude', 'two')).rejects.toThrow(/Max concurrency.*agent container/);
    release();
    await first;
    await expect(execAgent('claude', 'three')).resolves.toMatchObject({ note: '' });
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
