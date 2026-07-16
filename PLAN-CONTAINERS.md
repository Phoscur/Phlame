# PLAN-CONTAINERS.md — containerized test & browser runners

Companion plan to [PLAN.md](./PLAN.md). Concept adapted from the Hyphe monorepo's
runner design (its PLAN-MCP §4) — stripped to what Phlame needs: no Go toolchain, and
the game MCP ([PLAN-MCP.md](./PLAN-MCP.md), server `phlame-game`) stays a pure engine
sandbox — no shell, no Docker socket. Command execution lives exclusively in **Phorge**
(see Orchestration below), which inherits Hyphe's executor lessons (argv/spawn, closed
verbs, bounded output) from day one instead of retrofitting them.

## Why

1. **Trust boundary** (the origin of this plan): browser automation and test code are
   arbitrary code — they run in ephemeral containers, never ad hoc on the host. No
   generated one-off scripts; every entry point is checked in and reviewable.
2. **Windows native-binary mismatch**: host `node_modules` (esbuild, lightningcss)
   are win32 binaries; baking `npm ci` into a Linux image sidesteps bind-mount
   breakage and slowness.
3. **CI parity**: the self-contained image is exactly what CI wants — a fresh checkout
   with zero host state (switch tracked below, separate PR).

## Design

- **Two images**: `Dockerfile.test` — `node:24-alpine`, browser-less; serves vitest
  (app jsdom + engine node), tsc, lint AND the `app` service (Vite/Hono dev server).
  `Dockerfile.playwright` — official `mcr.microsoft.com/playwright:v1.61.1-noble`;
  deliberate Alpine exception (Playwright browsers need glibc), tag pinned in lockstep
  with `@playwright/test` in package-lock.json — **bump both together**.
- **`compose.test.yml`**: ephemeral `run --rm` only, never `up -d`. Services:
  `runner` (no network), `phlame` (the app; healthcheck on `/sum`, `NODE_ENV=test`),
  `playwright` (`BASE_URL=http://phlame:4200`, waits for the app healthy). Kept separate
  from any future deployment compose so `up` never starts test containers. The app
  service is deliberately NOT named `app` (or `dev`): those are HSTS-preloaded TLDs,
  Chromium force-upgrades `http://app/` to https and fails with ERR_SSL_PROTOCOL_ERROR.
- **Self-contained by default, dev overlay for iteration**: images bake deps
  (`npm ci --ignore-scripts`, layer keyed on the lockfile) and source. CI-shaped.
  `compose.test.dev.yml` bind-mounts source **read-only** over the baked tree for
  edit-rerun without rebuild. Phlame-specific simplification vs. Hyphe: no build step
  exists (Vite serves source, `@phlame/engine` resolves via alias, `tsc --noEmit`
  writes nothing) → no dist-rebuild caveat, no EROFS/tsbuildinfo problem. One trap
  found & handled: Vite's `cacheDir` resolves to `src/app/node_modules` — the overlay
  shadows it with a writable anonymous volume.
- **Writable mounts are the exception**: dependency manifests (`package.json`,
  lockfile — so an in-container `npm install` persists the _declaration_, while the
  installed bytes die with the container) and artifact sinks (`coverage/`,
  `playwright-report/`, `test-results/`, `screenshots/`).
- **Isolation details**: no `data/` mount — real saves are physically unreachable from
  containers; sessions in `app` are ephemeral. `runner` gets `network_mode: none`.
  No host port mapping on `app`.
- **Warm app is intentional**: `run --rm playwright` leaves the `phlame` dependency
  running — next run is fast, failure logs stay inspectable. `npm run containers:down`
  stops it.
- **Entry points** (all in package.json): `containers:build`, `containers:down`,
  `test:docker`, `tsc:docker`, `lint:docker`, `e2e:docker`, `screenshot:docker`.
  The `:docker` variants are the **default for agents** (see CLAUDE.md); bare host
  scripts remain for the pre-switch CI and human quick runs.
- **Screenshots**: `tests/screenshot.spec.ts` is the checked-in screenshot tool
  (`screenshots/` is gitignored output; curated shots for docs get committed
  elsewhere deliberately).

## Orchestration: Phorge (revised 2026-07-10)

First take ("no second MCP, Claude Code's permission allowlist is the gate") was
silently conditioned on _the agent running on the host_. The moment agents themselves
are banned into containers, that layer sits **inside** the container and gates nothing
that matters — the boundary is the container wall, and crossing it needs a controlled
channel. That channel is **Phorge** (`tools/phorge/`), the orchestration MCP: a closed
verb vocabulary over `compose.test.yml`, argv-spawned (no shell, Hyphe's executor
lessons: bounded output, timeout kill). The engine sandbox stays its own server,
renamed **`phlame-game`** (tools/mcp, PLAN-MCP.md) — pure, host-independent, may even
run _inside_ an agent container.

Discovery/probe/smoke are **tools, not scripts**: `status` (services, states, verb
list), `run(test|tsc|lint|e2e|screenshot, file?)` — `file` narrows test/e2e to one
spec and is the template for parameterized verbs: validated **structurally** (set
membership in the discovered `*.spec.ts` list, specs.ts; a unique basename works, a
miss returns the known specs), never a regex over a command string — identifiers
like the worktree slug get charset shape checks, commands stay a closed table.
`fmt(worktree?)` (in-place `vp fmt`
exec'd into the agent container — the run verbs' source mounts are read-only, so
the write path lives behind the rw mount), `screenshot` (returns the PNG inline as
MCP image content), `agy(prompt)` (headless Antigravity run in the agent container —
the first verb with a free-text parameter: the prompt stays one argv element,
shell-inert; `--dangerously-skip-permissions` is container-scoped by design, the
container wall is the boundary), `logs(service, tail)`, `build`, `down`. No new
scripts multiply — verbs invoke the same checked-in compose units.

Transport truth (the hard part of the agent ban): a stdio MCP spawned by a
containerized agent lives _in that container_ — it could only reach Docker via a
mounted socket, which is root-equivalent and would make the ban decorative. So:

- **O0 (this branch, shipped 2026-07-10)** — Phorge as stdio MCP on the host;
  Claude-on-host uses it today. Verb table, executor, orchestration and HTTP auth
  TDD'd (plan/exec/run/auth specs),
  `.mcp.json` registers both servers, `.claude/settings.json` allowlists them.
  Verified: stdio handshake, tools/list, and a live `status` call through the
  argv executor. Bash verbs stay as fallback.
- **O1** — host-owned Phorge over streamable HTTP + token auth (Hyphe §7.2: identity
  must not be a self-asserted string). No Docker socket ever enters an agent
  container. _Half landed 2026-07-11_: `server.http.ts` serves the stateless
  streamable-HTTP transport on `127.0.0.1:4201/mcp` behind a constant-time bearer
  middleware (`auth.ts`, spec'd; token via `.env`, fail-closed); stdio and HTTP
  entries share `tools.ts`. _Deployment landed 2026-07-11_: `${PHLAME_WORKTREE:-.}`
  parametrizes every bind-mount source, compose project names are pinned, and
  `tools/phorge/stack.ts` runs the whole stack from a git-clean sibling checkout
  (`../phlame-phorge`) — verified live: verbs green through the deployed instance
  while the runner demonstrably mounts the WORKTREE's `src`, with verb tables and
  compose topology from the clean checkout. Update = human pull + restart
  (docs/mcp-setup.md, "Host-owned deployment"). O1 hardened from "should" to
  **prerequisite** the moment any GitHub-touching
  verbs appear (PLAN.md open question 2: repo creation as game mechanic): a GitHub
  token next to an agent-writable verb table is an exfil channel — host-owned,
  git-clean checkout first, token never in an agent container.
  _Sharpened 2026-07-11_ — the O1 invariant, made explicit:
  - **The trust boundary is write access, not repo membership.** Phorge does NOT
    need to become a separate project for safety: a second git-clean checkout of
    this same repo (e.g. `C:\phorge-deploy\phlame`), run as a host service and
    updated only by a human pull+restart, satisfies O1 fully. Conversely a
    dedicated Phorge repo gains nothing on its own — `tsx` from any agent-writable
    path voids the boundary regardless of repo layout.
  - **The invariant covers everything the running instance executes OR
    interprets**: not just `tools/phorge/**` but the verb/plan tables and the
    **compose files**. A deployed Phorge that runs `docker compose -f` against the
    agent worktree's `compose.test.yml` hands the agent a bind-mount escape
    (`- /:/host`) despite the clean code. Compose YAML and verb tables load from
    the clean checkout; the agent workspace enters only as a data mount, at
    exactly the paths the clean compose files declare.
  - **`PHORGE_TOKEN`/`.env` live with the deployment, never in the worktree** —
    from day one, not just once GitHub-touching verbs raise the stakes.
- **O2** — the ban: agents (Claude & co.) run in their own container, `phlame-game`
  inside with them, Phorge's URL as the only door out. Concurrency control moves
  into Phorge when more than one agent knocks (Hyphe §7.4).
  _Infra started 2026-07-11 (C3 below); O1's host-owned deployment graduated from
  "should" to hard prerequisite — see the O2 concretization._

Honest caveat (Hyphe §3.1/§7.1 applies until O1+): Phorge's verb table lives in the
repo — agent-writable, reviewed via diff. The container is the blast-radius boundary,
the diff review is the intent boundary. O1's host-owned deployment (run from a
git-clean checkout, not the working tree) is what actually closes it.

**O2 Design Resolutions (2026-07-10)**:

- **Pre-built Phorge**: Phorge must run from a compiled `dist/` or a clean checkout, not via `tsx` on the active working tree. The agent can modify `tools/phorge/**/*.ts` all it wants, but the running orchestrator ignores those changes until a human rebuilds and restarts it. This extends beyond the TypeScript to compose files and verb tables — see the O1 invariant above.
- **Harden the run verbs**: If an agent modifies `package.json` (e.g. changing the `test` script) or `compose.test.dev.yml` in the workspace, a naïve `npm test` via compose could either execute arbitrary code in the runner container or escape to the host (via a malicious bind mount). Phorge must parse/execute these strictly or bypass `npm` scripts entirely (e.g. calling `vitest` directly). _Landed 2026-07-11_: run plans call `npx vitest/tsc/vp` directly (since the Vite+ migration, lint = `vp lint -c .oxlintrc.json` + `vp fmt --check`); the two-step test/lint chains use a `sh -c '<constant>'` inside the disposable runner — compile-time constants from the closed table, the documented exception in plan.ts.
- **Concurrency Limit & MCP "429"**: To prevent agents from melting the host, Phorge will enforce a strict concurrency limit (e.g. max 4 active runs). Since Phorge tools are invoked via MCP, hitting the limit won't return a raw HTTP 429; instead, the tool handler will return an explicit MCP error (`isError: true`) instructing the agent to wait.
- **Worker Pools & Sleeping Containers**: Instead of spinning up ephemeral `phorge-<verb>-<nanoid>` containers via `run --rm` every time (which incurs startup/install penalties), we can transition to warm "sleeping" containers defined in `compose.test.yml` (e.g., a standing `playwright` service). Phorge will `docker compose exec` into them for instant test execution. _Landed 2026-07-11_: playwright sleeps (`sleep infinity` + `init`), exec verbs are ensured-up first (`planUp`, dev overlay — idempotent lazy warm-up; compose recreates on config drift, so an overlay-less container heals instead of silently testing baked source). Measured: e2e 12/12 in 11s, screenshot 7s warm.
- **Local Fast Path**: The agent is encouraged to run `npm test` locally inside its own container for rapid TDD, only calling Phorge for heavy lifting (cross-browser e2e via the sleeping Playwright container) or guaranteed clean-room runs.

**O2 concretization — the agent container (2026-07-11)**:

- **Own image, own compose file.** Agents do NOT ride in the `runner`: the runner is
  network-less and ephemeral _by design_ (test code must not phone home), an agent
  needs egress (LLM APIs) and lives long. Merging them would destroy the property the
  runner exists for. `Dockerfile.agent` — `node:24-bookworm-slim`, the second
  deliberate Alpine exception (prebuilt agent binaries lean glibc; Hyphe's agent image
  is bookworm-slim too) — plus `compose.agents.yml`, kept out of `compose.test.yml`
  so its "`run --rm` only, never `up`" contract stays intact.
- **Deps shared by pattern, not by image**: the same lockfile-keyed `npm ci` layer as
  the test image, so the Local Fast Path (`npm test` inside the agent container)
  works. The repo is bind-mounted **rw** (editing is the agent's job) with
  `node_modules` shadowed by a named volume — the host tree carries win32 binaries.
  After a lockfile change the agent runs `npm ci` in-container (volume persists it).
- **Config is code, credentials are data — never rw-mount host agent config.**
  `~/.gemini`/`~/.claude` contain _host-executed configuration_: MCP server entries
  and settings hooks are argv the HOST runs on next start — a rw mount hands the
  contained agent a container-escape channel. Default layout: container-private named
  volumes for `/root/.gemini` and `/root/.claude`, seeded by an in-container login
  (agy: one-time npm run agent -- agy URL+code per volume, own refresh lineage, no race with the host; claude via `claude setup-token` →
  `CLAUDE_CODE_OAUTH_TOKEN`). Open (first real session decides):
  - [x] test seeding from host credential _files_ mounted `:ro` (config stays out)
  - [x] verify agy's credential store in a keyring-less container actually falls back
        to files that land in the volume (docs say libsecret on Linux)
- **agy cannot be pinned** — checked the installer 2026-07-11: the manifest is always
  latest (sha512-verified, but same-origin) and the binary **self-updates in the
  background during regular runs**, so the update channel exists whether we like it
  or not. Consequence: don't pretend determinism — log `agy --version` at build time,
  keep the self-update confined to a container-private path. `claude-code` IS
  pinnable (npm) and gets an exact version build-arg.
- **Phorge's HTTP URL is the only door out.** No Docker socket, ever. The agent
  reaches the host-owned endpoint as `host.docker.internal:4201` (reaches the
  127.0.0.1-bound listener on Docker Desktop; a native-Linux host would need a
  bridge binding — not our host today). Token via `.env` → container env; MCP config
  for the in-container agent points at the HTTP transport, NOT the repo `.mcp.json`
  stdio entries (those would spawn Phorge _inside_ the container, where no Docker
  lives — fails correctly, but noisily).
- **O1 is a hard prerequisite now, not a should.** Practice check (2026-07-11):
  Claude — and with it the tsx-spawned stdio Phorge — gets restarted routinely.
  "A human rebuilds and restarts" gates nothing when restarting is routine; every
  restart happily loads whatever was left in `tools/phorge/`. Host-owned deployment
  from a git-clean checkout/dist lands BEFORE the first agent container ever holds
  the token.

**Inheritance boundary vs. hyphe-mcp (decided 2026-07-10)** — compared side by side:

- **Inherited**: the executor lessons (argv/`shell:false`, byte cap, timeout kill) —
  now spec'd (`exec.spec.ts`: cap-kill, timeout-kill, non-zero-exit, spawn-error paths)
  instead of merely copied. Plus a fix Hyphe shares but hadn't closed either: killing a
  timed-out `docker compose run` kills only the CLI client, the container survives in
  the daemon. Run containers are therefore **named** (`phorge-<verb>-<runId>`) and
  reaped with `docker rm -f` on timeout; concurrency is bounded by in-process counters
  (runner 4, playwright 1) returning an MCP error at the limit. NOTE the exec variant
  of the same hole: a timed-out `compose exec` (e2e/screenshot in the sleeping
  playwright container) also only kills the client — the test process keeps running
  inside the container; reaped via `compose restart playwright` (`reap` in tools.ts).
- **Rejected — `cli-rules.ts`**: Hyphe's regex allowlist is a compensating control for
  its free-form `execute_command` surface. Its own comment trail (quoted-argument
  substitution holes, `$`/backtick/backslash bans re-fixed per call site) is the
  evidence that guarding open strings is a maintenance treadmill. Phorge's closed verb
  enum + argv tables make the entire gate unnecessary — free-form commands stay out,
  permanently. The regex lessons do transfer to the one place Phlame still has such a
  gate: the Bash-fallback allowlist in `.claude/settings.json`.
- **Deferred to O1**: the `McpTool` registry + `tools/index` split and the
  server/proxy/cli separation — worth adopting exactly when the HTTP transport forces
  transport and tool definitions apart, overhead before that.
- **Not applicable**: compose-topology discovery (`resolve.ts`) — one compose file,
  nothing to resolve; in-process grep/head/tail pipe emulation — `tail()` on a
  verdict-oriented output is enough.

**Extraction into its own project (decided 2026-07-11)**: a pure reuse decision,
not a safety one — see the O1 invariant (repo boundary ≠ trust boundary). Phorge
stays in this repo until a second project concretely adopts it; extracting earlier
buys versioning and a second release cycle for nothing and loses the TDD proximity
(specs test directly against this project's verb table). When that second project
arrives, the natural cut is **phorge-core** (executor, MCP server, HTTP transport,
auth, concurrency — the generic part carrying the Hyphe lessons) as its own
package, with the closed verb manifest (verbs, argv, compose services) staying in
each consuming repo. Caveat, so nobody mistakes the split for a security upgrade:
a declarative per-project manifest is exactly as agent-writable as `plan.ts` is
today — config is code. The deployed instance still reads it from a clean
checkout; the deployment model is unchanged by extraction, which is precisely why
it isn't worth pre-empting.

**Endpoint sharpened (2026-07-17, with hyphe PLAN-PHORGE §3.6)**: the second
project arrived (hyphe ported phorge, smoke passed), and with it the insight that
the agent-dispatch half was never game tooling. Once the hyphe-owned
**multi-tenant** phorge deployment serves the phlame tenant end to end (criterion:
one agent dispatched into a phlame worktree, collected, merged), phlame sheds the
`agy`/`claude`/`opencode`/`models`/`fmt` verbs, the agent stack
(`Dockerfile.agent`, `compose.agents.yml`, `tools/agent/`) and its copy of the
phorge server code. What stays HERE is what belongs to the game repo: the verb
**manifest** (run-verb table over `compose.test.yml`, Dockerfiles, AGENTS.md — how
to verify THIS repo is repo knowledge, and CI needs it anyway) and the pure
`phlame-game` MCP. Side benefit for the public repo: private-ops agent infra
leaves the open-source surface; contributors keep the plain npm/docker paths,
which never depended on phorge. Until that criterion is met, phlame:4201 keeps
all its verbs — nothing gets deleted transitionally.

## Milestones

### C0 — Runner infra (this branch)

- [x] `Dockerfile.test`, `Dockerfile.playwright`, `.dockerignore`
- [x] `compose.test.yml` + `compose.test.dev.yml`
- [x] `playwright.config.ts` BASE_URL switch, `vite.config.ts` allowedHosts
- [x] npm scripts + CLAUDE.md agent rule
- [x] `tests/screenshot.spec.ts`
- [x] Verified (2026-07-10): unit suite (19 files/98 tests), tsc, lint green in
      `runner`; full e2e 12/12 across chromium/firefox/webkit and the screenshot land
      via the `playwright` service. Two finds on the way: busybox wget probes
      `localhost` as `::1` while Vite binds IPv4-only (healthcheck → `127.0.0.1`),
      and the app service must not be called `app` (HSTS-preloaded TLD, see Design).

### C1 — CI switch (separate PR)

- [ ] `playwright.yml` builds the images and runs `docker compose -f compose.test.yml
run --rm playwright npx playwright test` (no dev overlay — self-contained).
- [ ] `testCoverage.yml` likewise via `runner`.
- [ ] Then: bare-host `e2e`/`ci` scripts become the exception, not the rule.

### C3 — Agent container (O2 infra, started 2026-07-11)

- [x] `Dockerfile.agent` (bookworm-slim, baked deps, agy + pinned claude-code) +
      `compose.agents.yml` (own project `phlame-agents`; named volumes for
      config/creds + node_modules shadow, repo rw, no socket, no `data/`) +
      npm scripts (`agents:build`, `agent`)
- [x] Verified (2026-07-11): image builds (agy 1.1.1, claude-code 2.1.207); Phorge
      HTTP from inside the container via `host.docker.internal` → 401 without / MCP
      initialize with the bearer token — Docker Desktop reaches the 127.0.0.1
      binding; node_modules volume seeds linux binaries from the image (vitest runs)
- [x] Credential seeding decided (`:ro` file/folder mounts used to share host credentials securely)
- [x] **E2E verified (2026-07-11)**: agy inside the agent container calls
      `run(lint)` through Phorge HTTP and reports the real verdict (first run
      honestly red on an unformatted file). Took two stacked fixes: session-map
      transport (one SDK transport per session — a singleton collides on the
      second client; stateless drops the GET SSE stream real agents open) and
      never reading a clone of an SSE response body for logging (blocks the
      reply until the stream ends — that hung agy's Go client in "waiting").
      @hono/node-server replaced the hand-rolled node↔web bridge.
- [x] `agy(prompt)` phorge verb (2026-07-11): containerized headless agy as a
      bounded tool (concurrency 1, 6-min timeout, restart-reap) — closes the
      loop both ways: agents in the container call verbs, phorge clients on the
      host dispatch containerized agent runs. Session setup moved into the
      container start command (tools/agent/setup.sh), so the verb needs no
      wrapper to have run first.
- [x] **O1 blocker cleared (2026-07-11)**: Phorge deployed host-owned from the
      git-clean `../phlame-phorge` checkout (esbuild bundle + deployment-owned
      `.env`, `PHLAME_WORKTREE` pointing at the agent worktree). Discipline note:
      the boundary only holds while Phorge is actually run from there — the
      worktree entries (`phorge:stack`/`phorge:up`) stay for dev, don't hand an
      agent container the token while one of those serves port 4201.
- [x] MCP wiring for in-container claude (2026-07-11): `CLAUDE_CODE_OAUTH_TOKEN`
      auth verified in-container; setup.sh generates `~/.claude-phorge-mcp.json`
      (HTTP) + workspace trust, headless runs go `--strict-mcp-config` so the repo
      `.mcp.json` stdio entries (host-side, can't work behind the wall) are
      skipped. `claude(prompt)` phorge verb added, sharing the single agent slot
      with `agy(prompt)`, same yolo mode (IS_SANDBOX=1 lifts claude's as-root
      refusal of --dangerously-skip-permissions); agent verbs exec via plain
      `docker exec` (compose exec keeps stdin open — claude stalls 3s per run).
      Verified: claude calls phorge `status`/`run(tsc)` from inside.

### C2 — Later / on demand

- [ ] Image staleness guard: warn when the baked lockfile hash ≠ working-tree lockfile
      (Hyphe's §7.5 — silent staleness is the sharpest edge of the baked approach).
- [ ] Log drain for `--rm` hard-crash cases (Hyphe §7.3) if flaky ghosts ever appear.
- [ ] Concurrent-runner lockfile race (Hyphe §7.4) — irrelevant while a single
      developer/agent runs tests; revisit with multi-agent workflows.
- [ ] Dissolve this PLAN-CONTAINERS.md into other docs

## Open questions

1. Commit curated screenshots (e.g. `docs/screenshots/` for the styleguide) or keep
   screenshots purely ephemeral?
2. Does `play` (Playwright UI mode) get a containerized story, or is interactive UI
   mode inherently a host affair? (Likely host — it opens a GUI.)
3. Flip the bare `test`/`tsc`/`lint` scripts to the docker variants once CI switched
   (C1), keeping `*:host` escapes? Or keep the current split permanently?
