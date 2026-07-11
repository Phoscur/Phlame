# Phorge & Agent Container Setup Guide

This guide describes how to run the Phorge MCP HTTP server and the agent containers.

## Architecture Overview

1. **Phorge Host HTTP Server**: Orchestration server that manages Docker containers. Runs on the host (Windows or WSL) and listens on port `4201`.
2. **Agent Container**: Runs the AI agents (e.g. `agy`, `claude`) inside an isolated Docker container, protecting the host machine.
3. **Communication**: The agent container communicates with the Phorge server on the host via `http://host.docker.internal:4201/mcp` using the token defined in your `.env`.

---

## The two .env files

There is one `.env` per phorge location — same template (`.env.dist`),
different roles:

|                           | worktree `.env` (this repo)                                                            | deployment `.env` (`../phlame-phorge`)                                          |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| used by                   | phorge run from the worktree (dev: `npm run phorge:stack`/`:up`) and host-side tooling | the deployed phorge AND the compose variable interpolation (containers, mounts) |
| visibility                | **visible to the agent** through the repo mount — only what the agent may see          | never inside a container                                                        |
| `PHORGE_TOKEN`            | yes                                                                                    | yes — **must match** the worktree value while both modes are in use             |
| `CLAUDE_CODE_OAUTH_TOKEN` | yes (dev-mode compose runs)                                                            | yes — must match likewise                                                       |
| `PHLAME_WORKTREE`         | no (defaults to `.`)                                                                   | **yes** — absolute path to the agent worktree                                   |
| `PHORGE_URL`              | optional (host-side agy)                                                               | no                                                                              |

The match requirement exists because the agent container's generated MCP
config must carry the token of whichever phorge answers on port 4201 — a
mismatch shows up as 401s after a rotation. Rotation order: both `.env` files
→ restart phorge (deployment) → `docker compose -f compose.agents.yml up -d
--force-recreate agent`.

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

To **rotate** it later: change BOTH `.env` files (see "The two .env files"),
restart Phorge (`npm run phorge:up`), then recreate the agent container so its
generated config picks it up:
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

## Running the stack

One cross-platform launcher, [`tools/phorge/stack.ts`](../tools/phorge/stack.ts)
(Windows, WSL and Linux alike): it bundles the Phorge server, builds + starts
the agent container, then runs Phorge.

```bash
npm run phorge:stack   # foreground — CTRL+C stops Phorge AND the agent stack
npm run phorge:up      # detached — logs/phorge.log + logs/phorge.pid
npm run phorge:down    # stop the detached Phorge (by pidfile) + agent stack
```

- Detached logs: `tail -f logs/phorge.log` (startup message lands in
  `logs/phorge.err.log` — Phorge logs to stderr).
- `npm run phorge:http` remains the server-only entry (bundle + run, no agent
  container).

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

## Headless claude runs

claude authenticates via `CLAUDE_CODE_OAUTH_TOKEN` (see First-time setup) and
runs in the **same yolo mode as agy** — permissions auto-approved inside the
container, the wall is the boundary. Two quirks are handled by
`tools/agent/setup.sh`, `compose.agents.yml` and the `claude(prompt)` phorge
tool:

- claude refuses `--dangerously-skip-permissions` when running as root (the
  container user) — `IS_SANDBOX=1`, set in `compose.agents.yml`, is its
  official container escape hatch and lifts that check for headless AND
  interactive sessions.
- The repo `.mcp.json` carries the **host-side stdio** phorge entry, which
  cannot work behind the container wall — headless runs use
  `--strict-mcp-config --mcp-config ~/.claude-phorge-mcp.json` (generated from
  env at container start) to reach phorge over HTTP instead.

```bash
# inside the container:
claude -p "Call the phorge status tool" --dangerously-skip-permissions \
  --strict-mcp-config --mcp-config ~/.claude-phorge-mcp.json
```

Both agent verbs exec via plain `docker exec` (stdin closed) — `compose exec`
keeps stdin open and claude then stalls three seconds "waiting for stdin" on
every run.

---

## Host-owned deployment (O1)

Running Phorge with `tsx`/`npm` from the agent worktree is fine for
development, but it voids the trust boundary the moment agents live in
containers: the agent can edit `tools/phorge/**` and the compose files, and
the next restart executes them. The O1 answer (see PLAN-CONTAINERS) is a
**second, git-clean checkout that only a human updates**:

```bash
# once:
git clone <repo> ../phlame-deploy
cd ../phlame-deploy
npm ci
cp /secure/location/.env .   # deployment-owned: PHORGE_TOKEN etc. — NOT the worktree .env
echo "PHLAME_WORKTREE=C:\\Users\\you\\Projects\\phlame" >> .env   # the agent worktree

npm run phorge:up

# update = human pull + restart:
git pull && npm ci && npm run phorge:up
```

What this buys, concretely:

- **Code, verb tables and compose files** load from the clean checkout — agent
  edits to the worktree copies are inert until a human reviews, merges and
  pulls them here.
- **The worktree enters only as data**: `${PHLAME_WORKTREE:-.}` is the source
  of every bind mount the clean compose files declare (code under test,
  artifact sinks, the agent's rw workspace). Without the variable everything
  resolves to `.` — the dev setup is unchanged.
- **Tokens live with the deployment**: the deployment `.env` feeds Phorge and
  the compose interpolation (`PHORGE_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`); the
  worktree `.env` is only needed when running Phorge from the worktree in dev.
- The compose project names are pinned (`phlame`, `phlame-agents`), so the
  deployed Phorge addresses the same container stack the dev setup does.
