import { spawn } from 'child_process';

/**
 * Thin session entry: ensure the agent container is up (its start command runs
 * tools/agent/setup.sh — config generation and credential seeding live THERE,
 * so every entry path gets them, not just this wrapper), then exec into it.
 *
 *   npm run agent            → bash in the container
 *   npm run agent -- claude  → a claude session
 *   npm run agent -- agy     → an agy session
 */
const compose = ['compose', '-f', 'compose.agents.yml'];

const up = spawn('docker', [...compose, 'up', '-d', 'agent'], { stdio: 'inherit' });

up.on('close', (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }
  const args = process.argv.slice(2);
  const exec = spawn('docker', [...compose, 'exec', 'agent', ...(args.length ? args : ['bash'])], {
    stdio: 'inherit',
  });
  exec.on('close', (execCode) => process.exit(execCode ?? 0));
});
