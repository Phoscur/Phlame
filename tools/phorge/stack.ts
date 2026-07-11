import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * Phorge stack launcher — the single cross-platform entry that replaced
 * mcp.sh/mcp.ps1 (two shell dialects were already drifting; one had a broken
 * lsof check). Everything is spawned argv-style, shell:false: esbuild through
 * its JS bin via the current node, docker directly — no npm/npx .cmd
 * indirection (Windows spawn refuses .cmd without a shell).
 *
 *   npx tsx tools/phorge/stack.ts             foreground; CTRL+C stops the agents too
 *   npm run phorge:up     (= --detached)      background; logs/ + pidfile
 *   npm run phorge:down   (= --down)          stop pidfile process + agent stack
 *
 * O1 note: run this from the HOST-OWNED clean checkout, not the agent
 * worktree — with PHLAME_WORKTREE in the deployment .env pointing at the
 * worktree (see docs/mcp-setup.md, "Host-owned deployment"). Compose files,
 * verb tables and the served bundle then all come from the clean checkout;
 * the worktree enters only as the data mounts those files declare.
 */

const require = createRequire(import.meta.url);

const args = new Set(process.argv.slice(2));
const PID_FILE = 'logs/phorge.pid';

// Keep in sync with the `phorge:build` npm script.
const ESBUILD_ARGS = [
  'tools/phorge/server.http.ts',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--packages=external',
  '--outfile=dist/phorge/server.http.js',
];

function run(cmd: string, argv: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function must(what: string, cmd: string, argv: string[]): Promise<void> {
  const code = await run(cmd, argv);
  if (code !== 0) {
    console.error(`[stack] ${what} failed (exit ${code})`);
    process.exit(code);
  }
}

/** Stop a previously detached phorge — by pidfile only, never by port. */
function stopPrevious(): void {
  if (!existsSync(PID_FILE)) return;
  const pid = Number(readFileSync(PID_FILE, 'utf8').trim());
  if (pid) {
    try {
      process.kill(pid);
      console.error(`[stack] stopped previous phorge (pid ${pid})`);
    } catch {
      // already gone
    }
  }
  rmSync(PID_FILE, { force: true });
}

async function down(): Promise<void> {
  stopPrevious();
  await must('agents down', 'docker', ['compose', '-f', 'compose.agents.yml', 'down']);
}

async function up(): Promise<void> {
  if (!existsSync('.env')) {
    console.error('[stack] .env missing — see docs/mcp-setup.md, "First-time setup"');
    process.exit(1);
  }
  stopPrevious();

  console.error('[stack] bundling phorge server...');
  await must('bundle', process.execPath, [require.resolve('esbuild/bin/esbuild'), ...ESBUILD_ARGS]);

  console.error('[stack] building + starting the agent container...');
  await must('agents build', 'docker', ['compose', '-f', 'compose.agents.yml', 'build']);
  await must('agents up', 'docker', ['compose', '-f', 'compose.agents.yml', 'up', '-d', 'agent']);

  const nodeArgs = ['--env-file=.env', 'dist/phorge/server.http.js'];
  if (args.has('--detached') || args.has('-d')) {
    mkdirSync('logs', { recursive: true });
    const out = openSync('logs/phorge.log', 'a');
    const err = openSync('logs/phorge.err.log', 'a');
    const child = spawn(process.execPath, nodeArgs, {
      detached: true,
      stdio: ['ignore', out, err],
    });
    writeFileSync(PID_FILE, `${child.pid}\n`);
    child.unref();
    console.error(
      `[stack] phorge detached (pid ${child.pid}) — logs/phorge.log; stop: npm run phorge:down`,
    );
  } else {
    console.error('[stack] phorge in the foreground — CTRL+C stops the agent stack too');
    const child = spawn(process.execPath, nodeArgs, { stdio: 'inherit' });
    process.on('SIGINT', () => child.kill());
    child.on('close', async (code) => {
      await run('docker', ['compose', '-f', 'compose.agents.yml', 'down']);
      process.exit(code ?? 0);
    });
  }
}

if (args.has('--down')) {
  await down();
} else {
  await up();
}
