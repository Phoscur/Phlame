import { describe, it, expect } from 'vitest';
import { execCapture, tail } from './exec';

// The current node binary: guaranteed present on host and in the runner image,
// and spawnable without a shell on every platform.
const node = process.execPath;

describe('phorge executor', () => {
  it('captures merged stdout+stderr and the exit code', async () => {
    const result = await execCapture(node, ['-e', 'console.log("out"); console.error("err")']);
    expect(result.code).toBe(0);
    expect(result.output).toContain('out');
    expect(result.output).toContain('err');
    expect(result.truncated).toBe(false);
    expect(result.timedOut).toBe(false);
  });

  it('reports a non-zero exit instead of rejecting — the caller owns the verdict', async () => {
    const result = await execCapture(node, ['-e', 'process.exit(3)']);
    expect(result.code).toBe(3);
  });

  it('rejects only when the binary cannot be spawned at all', async () => {
    await expect(execCapture('phorge-no-such-binary', [])).rejects.toThrow();
  });

  it('kills the process once output exceeds the byte cap', async () => {
    // writes forever — only the cap-kill ends it (a hang here means the kill is broken)
    const result = await execCapture(
      node,
      ['-e', 'setInterval(() => process.stdout.write("x".repeat(4096)), 1)'],
      { maxOutputBytes: 16 * 1024 },
    );
    expect(result.truncated).toBe(true);
    expect(result.timedOut).toBe(false);
    // collection stops at the overflowing chunk, so the capture stays bounded
    expect(result.output.length).toBeLessThan(16 * 1024 + 4096 + 1);
  });

  it('kills the process on timeout', async () => {
    const result = await execCapture(node, ['-e', 'setTimeout(() => {}, 60_000)'], {
      timeoutMs: 250,
    });
    expect(result.timedOut).toBe(true);
    expect(result.code).not.toBe(0);
  });
});

describe('tail', () => {
  it('passes short output through untouched', () => {
    expect(tail('short', 10)).toBe('short');
  });

  it('keeps the last chars behind a truncation marker', () => {
    const out = tail(`${'x'.repeat(100)}verdict`, 10);
    expect(out).toContain('…[truncated]…');
    expect(out.endsWith('verdict')).toBe(true);
  });
});
