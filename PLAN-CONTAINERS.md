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
list), `run(test|tsc|lint|e2e|screenshot)`, `screenshot` (returns the PNG inline as
MCP image content), `logs(service, tail)`, `build`, `down`. No new scripts multiply —
verbs invoke the same checked-in compose units.

Transport truth (the hard part of the agent ban): a stdio MCP spawned by a
containerized agent lives _in that container_ — it could only reach Docker via a
mounted socket, which is root-equivalent and would make the ban decorative. So:

- **O0 (this branch, shipped 2026-07-10)** — Phorge as stdio MCP on the host;
  Claude-on-host uses it today. Verb table and executor TDD'd (`plan.spec.ts` +
  `exec.spec.ts`, 15 specs),
  `.mcp.json` registers both servers, `.claude/settings.json` allowlists them.
  Verified: stdio handshake, tools/list, and a live `status` call through the
  argv executor. Bash verbs stay as fallback.
- **O1** — host-owned Phorge over streamable HTTP (`@hono/mcp` fits the stack) +
  token auth (Hyphe §7.2: identity must not be a self-asserted string). No Docker
  socket ever enters an agent container. O1 hardens from "should" to **prerequisite**
  the moment any GitHub-touching verbs appear (PLAN.md open question 2: repo creation
  as game mechanic): a GitHub token next to an agent-writable verb table is an exfil
  channel — host-owned, git-clean checkout first, token never in an agent container.
- **O2** — the ban: agents (Claude & co.) run in their own container, `phlame-game`
  inside with them, Phorge's URL as the only door out. Concurrency control moves
  into Phorge when more than one agent knocks (Hyphe §7.4).

Honest caveat (Hyphe §3.1/§7.1 applies until O1+): Phorge's verb table lives in the
repo — agent-writable, reviewed via diff. The container is the blast-radius boundary,
the diff review is the intent boundary. O1's host-owned deployment (run from a
git-clean checkout, not the working tree) is what actually closes it.

**O2 Design Resolutions (2026-07-10)**:
- **Pre-built Phorge**: Phorge must run from a compiled `dist/` or a clean checkout, not via `tsx` on the active working tree. The agent can modify `tools/phorge/**/*.ts` all it wants, but the running orchestrator ignores those changes until a human rebuilds and restarts it.
- **Harden the run verbs**: If an agent modifies `package.json` (e.g. changing the `test` script) or `compose.test.dev.yml` in the workspace, a naïve `npm test` via compose could either execute arbitrary code in the runner container or escape to the host (via a malicious bind mount). Phorge must parse/execute these strictly or bypass `npm` scripts entirely (e.g. calling `vitest` directly). *Landed 2026-07-11*: run plans call `npx vitest/tsc/oxlint/eslint` directly; the two-step test/lint chains use a `sh -c '<constant>'` inside the disposable runner — compile-time constants from the closed table, the documented exception in plan.ts.
- **Concurrency Limit & MCP "429"**: To prevent agents from melting the host, Phorge will enforce a strict concurrency limit (e.g. max 4 active runs). Since Phorge tools are invoked via MCP, hitting the limit won't return a raw HTTP 429; instead, the tool handler will return an explicit MCP error (`isError: true`) instructing the agent to wait.
- **Worker Pools & Sleeping Containers**: Instead of spinning up ephemeral `phorge-<verb>-<nanoid>` containers via `run --rm` every time (which incurs startup/install penalties), we can transition to warm "sleeping" containers defined in `compose.test.yml` (e.g., a standing `playwright` service). Phorge will `docker compose exec` into them for instant test execution. *Landed 2026-07-11*: playwright sleeps (`sleep infinity` + `init`), exec verbs are ensured-up first (`planUp`, dev overlay — idempotent lazy warm-up; compose recreates on config drift, so an overlay-less container heals instead of silently testing baked source). Measured: e2e 12/12 in 11s, screenshot 7s warm.
- **Local Fast Path**: The agent is encouraged to run `npm test` locally inside its own container for rapid TDD, only calling Phorge for heavy lifting (cross-browser e2e via the sleeping Playwright container) or guaranteed clean-room runs.

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
