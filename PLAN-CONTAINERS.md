# PLAN-CONTAINERS.md — containerized test & browser runners

Companion plan to [PLAN.md](./PLAN.md). Concept adapted from the Hyphe monorepo's
runner design (its PLAN-MCP §4) — stripped to what Phlame needs: no Go toolchain, no
command-gateway security workstream (Phlame's own [PLAN-MCP.md](./PLAN-MCP.md) MCP is a
pure engine sandbox — no shell, no Docker socket — so Hyphe's §3/§6/§7 hardening has no
counterpart here). **Revisit trigger**: should the Phlame MCP ever grow a
command-executing tool, read Hyphe's security workstream first.

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
  lockfile — so an in-container `npm install` persists the *declaration*, while the
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

## Orchestration (decided 2026-07-10): no second MCP

The agent-facing orchestration layer is **Claude Code's permission system, not a new
MCP**. The checked-in npm scripts are the fixed verb vocabulary (Hyphe's `orchestrate`
enum, minus the code); `.claude/settings.json` (committed) allowlists exactly those
verbs plus `docker compose -f compose.test.yml *`, so agents run tests, probe logs and
smoke-test freely — while anything outside the verb set still prompts. A dedicated
orchestration MCP would duplicate that gate with more code to maintain, and Hyphe's
gateway exists for a problem Phlame doesn't have (multiple agents over SSE across
nodes). The Phlame MCP stays a pure engine sandbox (PLAN-MCP.md).

Honest caveat (Hyphe §3.1 applies here too): the allowlist validates the *command*,
but the script bodies live in package.json — agent-writable, reviewed via diff. The
container is the blast-radius boundary, the diff review is the intent boundary. If
that ever stops being enough, the answer is host-owned out-of-repo tooling (Hyphe §6),
not an in-repo MCP.

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
