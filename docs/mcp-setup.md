# Phorge & Agent Container Setup Guide

This guide describes how to run the Phorge MCP HTTP server and the agent containers.

## Architecture Overview

1. **Phorge Host HTTP Server**: Orchestration server that manages Docker containers. Runs on the host (Windows or WSL) and listens on port `4201`.
2. **Agent Container**: Runs the AI agents (e.g. `agy`, `claude`) inside an isolated Docker container, protecting the host machine.
3. **Communication**: The agent container communicates with the Phorge server on the host via `http://host.docker.internal:4201/mcp` using the token defined in your `.env`.

---

## First-time setup (one-time, on the host)

Copy `.env.dist` to `.env`, then fill in the three values below. `.env` is
gitignored and visible to the agent through the repo mount — it may only ever
hold what the agent is allowed to see (its own tokens; host-only secrets never
go here).

### 1. `PHORGE_TOKEN` — the phorge bearer token

Any random secret; the server fails closed without it. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

To **rotate** it later: change `.env`, restart Phorge (`./mcp.sh` / `.\mcp.ps1`),
then recreate the agent container so its generated config picks it up:
`docker compose -f compose.agents.yml up -d --force-recreate agent`.

### 2. agy — login on the host, credentials are seeded automatically

agy has no headless-token command (yet); its credentials are files. Log in once
on the host:

```bash
agy   # first run opens the Google OAuth flow in your browser
```

That populates `~/.gemini/antigravity-cli/implicit/` (Windows: under
`%USERPROFILE%`, WSL: under `$HOME` — the compose mount handles both). The
agent container mounts that folder read-only and `tools/agent/setup.sh` copies
it into the container-private volume on every container start — nothing to
configure.

**Fallback** (no host login, or the seed stops working): log in from inside the
container — `npm run agent -- agy` prints an auth URL + one-time code; the
credentials land in the volume and persist across sessions.

Caveat to watch: if agy ever rotates the credential files, the host and
container copies drift — if your host login breaks after container use, prefer
the in-container login and drop the seed mount.

### 3. `CLAUDE_CODE_OAUTH_TOKEN` — claude subscription login as a token

Claude is cleaner: `claude setup-token` (run it anywhere you are logged in,
e.g. the host; requires Pro/Max) walks through the OAuth flow once and prints a
**long-lived token** (`sk-ant-oat01-…`). Paste it into `.env` — same
subscription billing as your interactive login, no files shared into the
container, revocable in your account settings.

Deliberately NOT supported: mounting `~/.claude/.credentials.json` into the
container. That file lives off refresh-token rotation — two clients refreshing
the same credentials invalidate each other, and the loser is typically your
host login (see the comment in `compose.agents.yml`). Use the token.
(`ANTHROPIC_API_KEY` would work too, but bills pay-per-token API credits
instead of your subscription.)

### 4. Build the images

```bash
npm run agents:build     # agent container (agy + claude)
npm run containers:build # test runner stack (phorge verbs run in these)
```

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

- Logs are written to `logs/phorge.log` and `logs/phorge.err.log`.
- To follow the logs: `tail -f logs/phorge.log`
- To stop: `npm run agents:down && kill $(cat logs/phorge.pid)`

### Under Windows PowerShell

```powershell
.\mcp.ps1 -Detached
```

- Logs are written to `logs/phorge.log` and `logs/phorge.err.log`.
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

The container's start command runs `tools/agent/setup.sh`: it generates agy's
MCP config from the container env (agy does not expand `${VAR}` placeholders in
config files) and copies the read-only-mounted host credentials into the
container-private volume. A rotated `PHORGE_TOKEN` lands via
`docker compose -f compose.agents.yml up -d --force-recreate agent`.

## Headless agy runs

Inside the container, agy runs non-interactively with permissions auto-approved:

```bash
agy --dangerously-skip-permissions -p "Call the phorge status tool"
```

`--dangerously-skip-permissions` is a deliberate, **container-scoped** choice:
the container wall is the permission boundary (PLAN-CONTAINERS O2) — the agent
may do anything inside, and nothing outside except talk to Phorge. Never run
agy with this flag on the host.

The same run is available as a **phorge MCP tool**: `agy(prompt)` — warm-up,
one-at-a-time concurrency, 6-minute timeout, bounded output. That closes the
loop both ways: agy-in-the-container calls phorge verbs, and any phorge client
(e.g. Claude on the host) can dispatch a containerized agy run.
