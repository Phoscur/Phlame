# Phorge & Agent Container Setup Guide

This guide describes how to run the Phorge MCP HTTP server and the agent containers.

## Architecture Overview

1. **Phorge Host HTTP Server**: Orchestration server that manages Docker containers. Runs on the host (Windows or WSL) and listens on port `4201`.
2. **Agent Container**: Runs the AI agents (e.g. `agy`, `claude`) inside an isolated Docker container, protecting the host machine.
3. **Communication**: The agent container communicates with the Phorge server on the host via `http://host.docker.internal:4201/mcp` using the token defined in your `.env`.

---

## Quick Start (Interactive Foreground Mode)

By default, the scripts run Phorge in the **foreground**, meaning logs are printed directly to the console and hitting `CTRL+C` will automatically stop Phorge and stop the Docker agent containers for you.

### Under WSL / Linux

```bash
chmod +x mcp.sh
./mcp.sh
```

### Under Windows PowerShell

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\mcp.ps1
```

---

## Detached Background Mode

If you prefer to run Phorge in the background and write outputs/errors to log files, pass the `-d` or `--detached` switch:

### Under WSL / Linux

```bash
./mcp.sh -d
```

- Logs are written to [**`logs/phorge.log`**](file:///mnt/c/Users/phosc/Projects/phlame/logs/phorge.log) and `logs/phorge.err.log`.
- To follow the logs: `tail -f logs/phorge.log`
- To stop: `npm run agents:down && kill $(cat logs/phorge.pid)`

### Under Windows PowerShell

```powershell
.\mcp.ps1 -Detached
```

- Logs are written to [**`logs/phorge.log`**](file:///mnt/c/Users/phosc/Projects/phlame/logs/phorge.log) and [**`logs/phorge.err.log`**](file:///mnt/c/Users/phosc/Projects/phlame/logs/phorge.err.log).
- To follow the logs: `Get-Content -Path logs/phorge.log, logs/phorge.err.log -Wait`
- To stop: `npm run agents:down; Stop-Process -Id (Get-Content logs/phorge.pid) -Force`

---

## Jumping Into the Container

Once the stack is up, you can jump directly into the agent container to execute commands (including the `agy` CLI):

```bash
npm run agent
```

Inside the container shell, the `agy` command is fully available:

```bash
# Inside the container:
agy
```
