import { spawn } from 'child_process';

const up = spawn('docker', ['compose', '-f', 'compose.agents.yml', 'up', '-d', 'agent'], {
  stdio: 'inherit',
});

up.on('close', (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  // Automate generation of ~/.gemini/mcp_config.json inside the container
  // using its environment variables (which resolves the placeholder expansion limitation of agy).
  const configCmd =
    'mkdir -p ~/.gemini/config && echo \'{"mcpServers": {"phorge": {"url": "\'"$PHORGE_URL"\'", "headers": {"Authorization": "Bearer \'"$PHORGE_TOKEN"\'"}}}}\' > ~/.gemini/mcp_config.json && cp ~/.gemini/mcp_config.json ~/.gemini/config/mcp_config.json && mkdir -p ~/.gemini/antigravity-cli/implicit && cp -f ~/.gemini/antigravity-cli/implicit-host/*.pb ~/.gemini/antigravity-cli/implicit/ 2>/dev/null || true';
  const setupConfig = spawn('docker', [
    'compose',
    '-f',
    'compose.agents.yml',
    'exec',
    '-T',
    'agent',
    'sh',
    '-c',
    configCmd,
  ]);

  setupConfig.on('close', (configCode) => {
    if (configCode !== 0) {
      console.error(
        'Warning: Failed to auto-generate ~/.gemini/config/mcp_config.json inside the agent container.',
      );
    }

    // Extract arguments passed to the script (e.g. `npm run agent -- claude` -> `claude`)
    const args = process.argv.slice(2);
    const execArgs = ['compose', '-f', 'compose.agents.yml', 'exec', 'agent'];

    if (args.length > 0) {
      execArgs.push(...args);
    } else {
      execArgs.push('bash');
    }

    const exec = spawn('docker', execArgs, { stdio: 'inherit' });

    exec.on('close', (execCode) => {
      process.exit(execCode ?? 0);
    });
  });
});
