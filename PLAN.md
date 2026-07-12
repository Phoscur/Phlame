# PLAN.md

Living plan for Phlame — written for Phoscur + AI agents, not a public roadmap.
Milestones, no dates (spare-time project; Easter has a POC tradition, nothing binding).
Update this file as work lands; move settled questions into [docs/decisions/](docs/decisions/README.md).

## North star

A nice little single-player idle game you can play from static hosting, whose save you
can share — and whose architecture quietly prepares the 2.0 multiplayer vision.

Settled direction (see ADRs): static-first deployment with shareable saves
([0010](docs/decisions/0010-static-first-deployment.md)), event-sourced actions
([0009](docs/decisions/0009-event-sourced-actions.md)), one global lazily-caught-up
timeline ([0002](docs/decisions/0002-lazy-realtime-economy.md) — `zeit.json` + "o.d."
catch-up formalized, not per-session time).

## Milestone 0 — Nail the foundations (before features)

Small decisions that get expensive to change once actions & persistence formats spread:

- [x] Fix `ID` to string — done 2026-07, [ADR 0019](docs/decisions/0019-string-ids.md);
      compiled without a single fix (`PhelopmentIdentifier` converges separately at M2).
- [x] Action schema defined — `engine/src/lib/EmpireLog.ts` (2026-07): `GenesisJSON`,
      `LogEntryJSON` (`{ seq, tick, type, concerns: ID[], payload }`, total order
      `(tick, seq)`), `ConsequenceJSON` (the ADR 0018 echo), `EmpireLogJSON` carrying the
      universe Phingerprint. Types now; the empire-log implementation fills them at M1.
- [x] Genesis defined — `genesisFor`/`fromGenesis` in `src/app/engine/services.ts`
      (2026-07): deterministic birth under the current Phormulae, Phingerprint-guarded;
      `seed` reserved in the schema for future env derivations (Economy seed TODO).
- [x] Standing invariant test — `src/app/engine/replay.spec.ts` (2026-07):
      same genesis + same actions ⇒ same state for any tick split (incl. 100×1, through
      the waiting build queue). Grows into full `replay(genesis, log)` with M1's log.
- [x] **Rules as data** ([ADR 0014](docs/decisions/0014-rules-as-data.md)) — **complete**
      2026-07: `Phormulae` value object; lookups are kind-discriminated `Phormula`
      descriptors ([ADR 0015](docs/decisions/0015-phormula-descriptors-pure-building.md));
      `Phelopment` (ex-Building, [ADR 0016](docs/decisions/0016-phelopment-rename.md)) is
      pure state, the `Economy` interprets the rules; the universe **Phingerprint**
      ([ADR 0011](docs/decisions/0011-universe-rules-hash.md)) = FNV-1a over canonical
      JSON; and injection is done — `Phormulae.current` and all static shims are gone,
      every `Economy` takes its Phormulae explicitly. No hidden global state remains.
      Still open (M1): wire the Phingerprint into the save/action-schema.
- [x] CI green and **enforced** (2026-07): both workflows pass; master branch protection
      requires "Lint (fast fail)", "Test & Typecheck" and "e2e (playwright)" with
      `enforce_admins` — no direct pushes to master anymore, everything lands via green
      PRs. Check names hardened (matrix suffix removed, playwright job named).
- [x] DCO sign-off required for contributions — see CONTRIBUTING.md
      ([ADR 0013](docs/decisions/0013-open-source-monetization-deferred.md)).
- [ ] **License guardrail**: decide whether `engine/` switches to Apache-2.0 _before_
      merging the first substantial external engine contribution — after that,
      unilateral relicensing is off the table. Game stays AGPL either way (ADR 0013).

## Toolchain (2026-07 dependency upgrade to Node 24 + Vite 8)

Bumped everything to max and dropped babel. Notes for whoever touches the build next:

- **Standard decorators without babel**: `@joist/di` uses standard (2023-05) decorators.
  Vite 8 / Vitest 4 transpile with **Oxc, which does not transform standard decorators at
  any target or option** (verified: only `decorator.legacy` exists, wrong semantics for
  joist; upstream deliberately deferred until the spec stabilizes —
  https://github.com/oxc-project/oxc/issues/9170, no ETA). esbuild _does_ (at a target
  below esnext) and ships with the toolchain anyway (tsx bundles it) — so
  `vite.config.ts` has a tiny `esbuildDecorators` pre-plugin, **scoped to files that
  contain decorator syntax** (line-leading `@identifier`); everything else stays on the
  fast Oxc default path. `tsx` (preview/server) covers itself via `tsconfig.json` target
  ES2022. Watch #9170: when oxc lands ecma decorators, delete the plugin + explicit
  esbuild dep and set the Oxc target instead.
- Dropped deps: babel (all `@babel/*`, `vite-plugin-babel`), `vite-tsconfig-paths`
  (replaced by a one-line `resolve.alias`), `vite-plugin-dts` (lib `.d.ts` now via
  `tsc`). Added `esbuild` explicitly (the plugin imports it directly). `cross-env` stays:
  Node's `--env-file` can't replace it here — `start-server` needs `NODE_ENV=test` in a
  grandchild (`npm start` → vite), and `--env-file` is a node-process flag that Node
  explicitly forbids in `NODE_OPTIONS`. (Could instead drop the var entirely — it only
  prefixes e2e session files `test-` vs `dev-`; dev is already non-prod.)
- TS 6 / Vitest 4 config fixes: removed deprecated `baseUrl` (paths now `./`-relative),
  triple-slash ref is `vitest/config`.
- Lint: `.oxlintrc.json` turns off `no-unused-expressions` for `*.spec.ts` (chai-BDD
  getters like `expect(x).to.be.true`). Note the footgun: typo'd getters pass silently —
  reconsider if we ever move specs to call-style (`toBe(true)`).
- [x] **Dev server SSR fixed** (2026-07): Vite 8 no longer tolerates non-absolute module
      ids from the SSR loader — `@hono/vite-dev-server`'s `entry` must be
      `path.resolve('src/server.ts')` (a relative entry made every relative import in
      `server.ts` unresolvable: "Failed to load url ./html.element.server").
- [x] **Dropped `start-server-and-test` + `cross-env`** (2026-07): Playwright's built-in
      `webServer` (playwright.config.ts) starts/reuses the dev server, probes
      `/sum` for readiness (`/` would write a session file per poll) and passes
      `NODE_ENV=test` directly. `ci` script = `playwright test`. `tests/build.spec.ts`
      is `test.fixme` TDD for the M1 queue UI — flip to `test` when it lands.
- [ ] `npm run build` still fails on the missing `src/app/index.html` entry
      (pre-existing; ties into the M3 static build story).

### Vite+ migration (decided 2026-07-11, containers branch)

Vite+ (`vite-plus`, CLI `vp`) went **MIT / fully open source** with the 2026-03 alpha
(the initially considered company licensing was dropped) and bundles
Vite/Vitest/Oxlint/Oxfmt/Rolldown/tsdown behind one CLI (`vp check` =
fmt + lint + typecheck). Beta as of 2026-07 (v0.2.x — young, expect sharp edges).
The oxfmt reformat churn is acceptable on this branch — it already carries the
Prettify commit.

- [x] Migrated (2026-07-11): `vp migrate` + manual cleanup — `vite` aliased to
      `@voidzero-dev/vite-plus-core@0.2.4` via overrides, vitest pinned 4.1.10
      (identical to what we had; oxlint 1.72.0 too — a low-risk window). Two
      migrate artifacts reverted by hand: the `devEngines` block (npm 11 on host
      and in the node:24 images hard-fails on `onFail: download`) and a missing
      `tslib` (importHelpers lost its accidental transitive provider — now a
      direct devDep).
- [x] prettier → oxfmt landed as pure-reformat commit; prettier + eslint deps and
      configs dropped. oxfmt formats the WHOLE repo (md/json/yml included — wider
      than the old prettier scope, accepted). Options live in the `fmt` block of
      vite.config.ts (`--migrate=prettier` converted .prettierrc/.prettierignore;
      `endOfLine: auto` unsupported → dropped). One idempotency hiccup: a file
      needed a second `vp fmt` pass to satisfy `--check` — if that recurs, report
      upstream.
- [x] Scripts, Phorge verb table, CLAUDE.md, CI updated. Sharp edge found: the
      `oxlint` bin that vite-plus ships is an IDE/LSP wrapper — linting goes
      through `vp lint`, which does NOT auto-discover `.oxlintrc.json`; it needs
      `-c .oxlintrc.json` explicitly (npm `lint` script + phorge lint verb do).
      The file stays canonical because CI's fast-fail job runs standalone
      `oxlint@1.72.0` against it — that pin now tracks the vite-plus bundle,
      bump together.
- [x] Verified (2026-07-11, containerized via phorge after image rebuild): test
      12+19 files green, tsc clean, lint + fmt --check clean, e2e 12/12 across
      three browsers — `vp dev` serves the app in the phlame service, the
      standard-decorators esbuild pre-plugin survived the core swap, engine's
      `npx vitest` keeps resolving from the root install.

## Side quest — MCP CLI (engine-ui reborn)

Detailed plan: [PLAN-MCP.md](./PLAN-MCP.md) — prerequisites: rules-as-data (ADR 0014),
DOM-free config imports (app/engine barrel split), `tools/**` toolchain reach, zod-v4
SDK gate.

The old console engine-ui returns as agent tooling: a small stdio MCP server
(`@modelcontextprotocol/sdk`, one tsx script, e.g. `tools/mcp/`) wrapping
`EngineService`/`EmpireService` with tools like `new_session`, `advance_ticks(n)`,
`production_table`, `upgrade_building`, `show_log`. Lets AI agents actually _play_
the game deterministically — useful for the M0 invariant test, M1 queue debugging,
and M2 balancing runs ("play 10k ticks, show me the curves"). Not on the 1.0
critical path; build alongside M1.

## Side quest — containerized test & browser runners

Detailed plan: [PLAN-CONTAINERS.md](./PLAN-CONTAINERS.md) — ephemeral Docker runners
(Alpine for vitest/tsc/lint, official Playwright image for browsers) so agent-driven
test and browser runs never execute ad hoc on the host. C0 (infra) and C3 (agent
container: agy + claude themselves run containerized, Phorge HTTP as the only door
out) on this branch; C1 (CI switch) is a separate PR.

## Milestone 1 — Actions & building queue (the 1.0 core)

Started on the `game-actions` branch (2026-02): ActionFactory/EventFactory,
`Phlame.update` processes actions while fast-forwarding, zod-validated actions route,
empire middleware, e2e `build.spec` — plus a red test pinning a real energy-limit bug
(see below).

- [x] Energy limit bug fixed (2026-07): `EnergyCalculation.energies` sums rates first
      and applies the production _capacity_ directly as limit, instead of routing limits
      through `add()`, whose negative-net branch applies stock-withdrawal semantics
      (summing limits — 50 became 100; also mispinned as 40 in two other specs).
      Un-blocking the spec exposed two more `Phlame.update` bugs, also fixed: applied
      actions re-applied on the next update (boundary in `upcoming`), and ticks after
      the last action were not fast-forwarded; actions now apply in chronological order.
- [x] **Empire log landed 2026-07** (ADR 0012/0018): commands enter through
      `Empire.enqueue` — appends the trusted `LogEntryJSON` (`(tick, seq)` order,
      `concerns: ID[]`) and projects an Action into each concerned entity's queue
      (`Phlame.actions` is the projection; `consequence.at` = orderedAt, one meaning).
      `Phlame.update` appends **consequence echoes** (`${actionId}:started/:completed`,
      idempotent, deterministic) instead of mutating payloads — the ADR 0018 debt is
      paid. `Empire.applyLog(entries, tick)` replays in `(tick, seq)` order;
      `replay(genesis, log) ≡ interactive play` is green incl. regenerated echoes
      (replay.spec), callable as `replayCheck` (kit), `verify` (console) and
      `replay_check` (MCP). `cancel` refuses started builds (refunds are M2).
      Old `Event`/`EventFactory` shapes removed (superseded by `ConsequenceJSON`).
- [x] Building queue as first action type — **Wartefunktion landed 2026-07**
      (`phlame-mcp` branch): FIFO queue in `Phlame.update` waits until costs become
      affordable (`Economy.ticksUntilAffordable`), fetches them, builds for
      `upgradeTime` (with `minBuildTime` floor in the Phormulae), applies the grade;
      queued actions serialize with the save and rehydrate (`EngineFactory`); UI queue + cancel + e2e `build.spec` green. The payload-mutation debt was paid with the
      empire log (above): [ADR 0018](docs/decisions/0018-actions-and-consequences.md)
      echoes replaced `startedAt`/`at` edits.
- [ ] Persistence v2: save = genesis + empire action log (+ snapshot as cache);
      file/localStorage backends behind one interface. Supersedes parts of ADR 0008.
      The console kit already saves `{genesis, empire}` with the log inside and
      restores replay-verified (2026-07); the app's `PersistedSession` follows.
- [ ] UI: queue display, cancel, time-remaining (Zeitgeber `passed` helps).
      Queue capacity is ruled by `Phormulae.queueSlots` (a `constant` Phormula, 2026-07;
      enforced in `Phlame.add`) — NOTE: it counts _all_ open actions; differentiate per
      queue kind once non-build actions exist (transports, M2).

## Milestone 2 — Gameplay depth

- [ ] Tech/research: activate `PhelopmentRequirement.dependencies` (the `isSatisfied` TODO),
      decide tech-as-phelopment vs own entity (open question 5).
- [ ] Special buildings (build-faster etc.), better assets/building images.
- [ ] Colonization + transports between Phlames (Empire already holds multiple planets;
      transports = paired actions on two entities — first cross-entity consistency test).
- [ ] Balancing pass — fresh balance, deliberately moving away from UGamela (decided
      2026-07; [docs/artifacts/ugamela-loader.json](docs/artifacts/ugamela-loader.json)
      is historical reference only). Where the tables live (code vs data) is still open
      and feeds the rules hash (ADR 0011).

## Milestone 3 — Static-first release (1.0)

- [ ] Client-only mode: `EngineService`-equivalent in the browser, localStorage
      persistence, no server required at runtime (ADR 0010).
- [ ] Full static build deployed (GitHub Pages class hosting).
- [ ] Save sharing v1: export/import (JSON file, maybe URL-encoded genesis+log).
- [ ] Service worker / PWA: offline, cache (roadmap: "hono local storage cache in SW").
- [ ] Polish: light theme (Tailwind 4 is stable now), i18n completeness, e2e core flows.

## 2.0 vision — Combat, trade, shared universes

Not scheduled; 1.0 architecture must not block it (that's why event sourcing + global
time + rules versioning land first).

- Ships, ships, ships — fleets, trade (order, deliver & pickup), combat. Early entity
  and scenario sketches (Moon, Shipyard, Fleet missions, Galaxy/Solarsystem events)
  survive in [docs/artifacts/actions.md](docs/artifacts/actions.md).
- Shared encrypted snapshots in common data repos; action collision resolution;
  timewarp detection after espionage (replay someone's log to audit it).
- P2P universes: α (every repo its own universe), Ω (anything compatible), β/γ forks;
  git as transport and storage (service-worker push), maybe reviving `peer-server`.
- Ephemeris: heavenly bodies in motion — planetary systems orbit their sun, which moves
  itself; position as a function of the timeline (big and small flames of life — the
  uniform Phlame entity tree of ADR 0012 keeps this door open).
- Open groundwork this needs from 1.0: deterministic replay (M0/M1), rules-version
  in saves, share format (M3).

## Open questions (the grill — answer over time, then ADR them)

Answered so far: rules versioning + time authority/trust → [ADR 0011](docs/decisions/0011-universe-rules-hash.md)
(universe = rules hash, everything Ω, saves may break pre-1.0); balancing → fresh, away
from UGamela (see M2); total order / aggregate root → [ADR 0012](docs/decisions/0012-empire-owns-the-log.md)
(Empire owns the log, "everything is a Phlame" as intent, ownership changes only via
entity re-creation); Energy/Resource merge → [ADR 0004](docs/decisions/0004-resource-energy-separate.md)
revisited & confirmed (2026-07-12 discovery dry-run, the agent-worktree warm-up: merge
fights back — constructor clamp blocks composition, class-identity `isEnergy` forces a
flag; dedup-for-its-own-sake, separation stands; evidence on `agent/energy-merge`, and
the dry-run exposed that the specs never pinned negative Energy amounts directly —
being fixed as a follow-up task).

1. **Content location**: where do balancing/prosumption tables live long-term — code
   (`buildings.ts`) or data (`phlame-data` repo)? Must end up canonical + hashable
   (ADR 0011).
2. **Share transport**: file only, URL fragment, gist/repo push? Auth story for
   git-based sharing (PAT in browser is ugly)? Direction set 2026-07: GitHub side
   effects (repo creation is game mechanic — Phlame is open source, universes can live
   in repos) never run free-form and never from client/agent context. They go through
   a **closed verb vocabulary** on a host-owned MCP (Phorge sibling; the pattern from
   [PLAN-CONTAINERS.md](./PLAN-CONTAINERS.md) Orchestration): dedicated machine
   account/org, fine-grained token (repo write only), **no delete verb** (archive
   instead — irreversible actions stay undefined), rate-limited and idempotent naming
   (replay-safe, fits the empire log). Hard prerequisite: PLAN-CONTAINERS **O1** — a
   GitHub token next to an agent-writable verb table is an exfil channel, so this MCP
   must be host-owned from a git-clean checkout before any token exists.
3. **Tech tree shape**: direction set by ADR 0012 (research = empire-level buildings on
   the Empire's own economy) — confirm against reality when M2 starts: one research
   queue or several? research points as a resource or plain cost deduction?
4. **Action log compaction**: when do checkpoints truncate the log — per session, per N
   ticks, on save-share?
5. **Old siblings**: `phlame-server`, `phlame-ui`, `engine-ui`, `peer-server`, `proxy` —
   archive them explicitly (README note in parent) or keep any alive for 2.0?
6. **i18n scope**: de/en only for 1.0?

## Icebox (unsorted ideas, no commitment)

- Try Bun again; component tests + a playground for ResourceCalculation strategies;
  VanJS/SolidJS evaluation; drop TypeScript for the app build?; htmx-ws for server push;
  zod validation for persisted JSON; sqlite if the server path ever needs it.
- Stake-gated universes (2.0+, ADR 0013): a sun in certain β/γ universes requires
  holding ADA in a designated Cardano stake pool — entry cost via read-only chain
  query at universe-signature time, no tokens/NFTs. Strictly off the critical path.

## Doc upkeep

- [x] README slimmed (2026-07): roadmap → this file, history/POC learnings →
      [docs/history.md](docs/history.md), docs section points at CONTEXT.md.
- [x] `engine/README.md` shrunk to test instructions + pointers (2026-07).
- [x] Directory restructure done (2026-07): this repo is now `~/Projects/phlame`, the old
      monorepo retired to `phlame-legacy`; treasures rescued to
      [docs/artifacts/](docs/artifacts/README.md). The stale `phlame.code-workspace`
      (dead Nx paths) died with it. `engine-ui`'s console idea gets reinvented in-repo
      (console/MCP CLI) rather than dragging the old code along — see Icebox.
