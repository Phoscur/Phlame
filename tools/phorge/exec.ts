import { spawn } from 'node:child_process';

/**
 * Shell-free executor. argv elements are discrete arguments (shell:false),
 * so nothing is ever interpolated. Output is byte-capped (a runaway `logs -f`
 * must not buffer to heap exhaustion) and the process is killed on cap or timeout
 * — both lessons inherited from Hyphe's executor hardening.
 *
 * Caveat the caller must handle: killing `docker compose run` kills only the CLI
 * client — the container keeps running in the daemon. Run containers are therefore
 * named (plan.ts) so a timed-out run can be reaped with `docker rm -f`.
 */
export interface ExecResult {
  code: number;
  output: string;
  truncated: boolean;
  timedOut: boolean;
}

export interface ExecLimits {
  timeoutMs?: number;
  maxOutputBytes?: number;
}

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MiB
const TIMEOUT_MS = 10 * 60_000; // e2e across three browsers stays well under this

export function execDocker(argv: string[], limits: ExecLimits = {}): Promise<ExecResult> {
  return execCapture('docker', argv, limits);
}

/** Generic capture core, exported so the cap/timeout/error paths are testable without Docker. */
export function execCapture(
  file: string,
  argv: string[],
  { timeoutMs = TIMEOUT_MS, maxOutputBytes = MAX_OUTPUT_BYTES }: ExecLimits = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, argv, { shell: false, cwd: process.cwd() });

    const chunks: Buffer[] = [];
    let bytes = 0;
    let truncated = false;
    let timedOut = false;

    const collect = (chunk: Buffer) => {
      if (truncated) return;
      bytes += chunk.length;
      chunks.push(chunk);
      if (bytes > maxOutputBytes) {
        truncated = true;
        child.kill('SIGKILL');
      }
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code: code ?? -1,
        output: Buffer.concat(chunks).toString('utf8'),
        truncated,
        timedOut,
      });
    });
  });
}

/** Last `chars` of an output — agents want the verdict, which lives at the end. */
export function tail(output: string, chars = 4000): string {
  return output.length <= chars ? output : `…[truncated]…\n${output.slice(-chars)}`;
}
