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

- [ ] Fix `ID` to string (drop `string | number`) — engine-wide, mini-ADR.
- [ ] Define the Action schema — empire-scoped per
      [ADR 0012](docs/decisions/0012-empire-owns-the-log.md):
      `{ universe: rulesHash, genesis, actions: [{ seq, tick, type, concerns: ID[], payload }] }`,
      total order = `(tick, seq)`; rules-hash per
      [ADR 0011](docs/decisions/0011-universe-rules-hash.md).
- [ ] Define genesis: a new empire must be derivable deterministically (seed on
      `Economy` — the existing TODO), so a save can be `genesis + action log`.
- [ ] Standing invariant test: `replay(genesis, log)` ≡ incremental play, any tick split.
- [ ] **Rules as data** ([ADR 0014](docs/decisions/0014-rules-as-data.md)) — steps 1+2
      landed 2026-07: `Phormulae` value object (type registries + tuning constants,
      canonical `toJSON` for the future hash), the old statics are `@deprecated` read-only
      shims over `Phormulae.current`, the engine barrel no longer exports examples (fixture
      leak fixed, regression-tested in `Phormulae.spec.ts`), and both the app
      (`src/app/engine/resources.ts`) and the engine examples build + activate their
      Phormulae explicitly via `Phormulae.use()` — the push-registration path is gone.
      Still open: prosumption/requirement lookups into the Phormulae, actual injection
      (kill `Phormulae.current`), the rules hash itself.
- [ ] CI green and enforced (playwright.yml, testCoverage.yml) — e2e smoke as gate.
- [x] DCO sign-off required for contributions — see CONTRIBUTING.md
      ([ADR 0013](docs/decisions/0013-open-source-monetization-deferred.md)).
- [ ] **License guardrail**: decide whether `engine/` switches to Apache-2.0 *before*
      merging the first substantial external engine contribution — after that,
      unilateral relicensing is off the table. Game stays AGPL either way (ADR 0013).

## Toolchain (2026-07 dependency upgrade to Node 24 + Vite 8)

Bumped everything to max and dropped babel. Notes for whoever touches the build next:

- **Standard decorators without babel**: `@joist/di` uses standard (2023-05) decorators.
  Vite 8 / Vitest 4 transpile with **Oxc, which does not transform standard decorators at
  any target or option** (verified: only `decorator.legacy` exists, wrong semantics for
  joist; upstream deliberately deferred until the spec stabilizes —
  https://github.com/oxc-project/oxc/issues/9170, no ETA). esbuild *does* (at a target
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

## Side quest — MCP CLI (engine-ui reborn)

Detailed plan: [PLAN-MCP.md](./PLAN-MCP.md) — prerequisites: rules-as-data (ADR 0014),
DOM-free config imports (app/engine barrel split), `tools/**` toolchain reach, zod-v4
SDK gate.

The old console engine-ui returns as agent tooling: a small stdio MCP server
(`@modelcontextprotocol/sdk`, one tsx script, e.g. `tools/mcp/`) wrapping
`EngineService`/`EmpireService` with tools like `new_session`, `advance_ticks(n)`,
`production_table`, `upgrade_building`, `show_log`. Lets AI agents actually *play*
the game deterministically — useful for the M0 invariant test, M1 queue debugging,
and M2 balancing runs ("play 10k ticks, show me the curves"). Not on the 1.0
critical path; build alongside M1.

## Milestone 1 — Actions & building queue (the 1.0 core)

Started on the `game-actions` branch (2026-02): ActionFactory/EventFactory,
`Phlame.update` processes actions while fast-forwarding, zod-validated actions route,
empire middleware, e2e `build.spec` — plus a red test pinning a real energy-limit bug
(see below).

- [x] Energy limit bug fixed (2026-07): `EnergyCalculation.energies` sums rates first
      and applies the production *capacity* directly as limit, instead of routing limits
      through `add()`, whose negative-net branch applies stock-withdrawal semantics
      (summing limits — 50 became 100; also mispinned as 40 in two other specs).
      Un-blocking the spec exposed two more `Phlame.update` bugs, also fixed: applied
      actions re-applied on the next update (boundary in `upcoming`), and ticks after
      the last action were not fast-forwarded; actions now apply in chronological order.
- [ ] Implement Action/Consequence in the engine (replace interface-only `Action.ts`);
      the log lives on the Empire (ADR 0012), `Phlame.actions` becomes a projection.
      Replay orchestration in the empire-level update: fast-forward concerned entities
      to each action's tick, apply in `(tick, seq)` order.
- [ ] Building queue as first action type — `upgradeTime`/costs already exist on
      `Building`/`BuildingRequirement`; queue = actions with future consequences.
      Semantics per the 2008 original: **Wartefunktion** — players may queue entries
      regardless of current resources; the queue waits until each becomes affordable
      (see docs/history.md, the Fusionskraftwerk post already shipped this design).
- [ ] Persistence v2: save = genesis + empire action log (+ snapshot as cache);
      file/localStorage backends behind one interface. Supersedes parts of ADR 0008.
- [ ] UI: queue display, cancel, time-remaining (Zeitgeber `passed` helps).

## Milestone 2 — Gameplay depth

- [ ] Tech/research: activate `BuildingRequirement.dependencies` (the `isSatisfied` TODO),
      decide tech-as-building vs own entity (open question 5).
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
entity re-creation).

1. **Content location**: where do balancing/prosumption tables live long-term — code
   (`buildings.ts`) or data (`phlame-data` repo)? Must end up canonical + hashable
   (ADR 0011).
2. **Share transport**: file only, URL fragment, gist/repo push? Auth story for
   git-based sharing (PAT in browser is ugly)?
3. **Tech tree shape**: direction set by ADR 0012 (research = empire-level buildings on
   the Empire's own economy) — confirm against reality when M2 starts: one research
   queue or several? research points as a resource or plain cost deduction?
4. **Action log compaction**: when do checkpoints truncate the log — per session, per N
   ticks, on save-share?
5. **Old siblings**: `phlame-server`, `phlame-ui`, `engine-ui`, `peer-server`, `proxy` —
   archive them explicitly (README note in parent) or keep any alive for 2.0?
6. **Energy/Resource merge** (ADR 0004 `revisit`): does the actions work touch enough of
   the resource layer to justify doing the simplification first?
7. **i18n scope**: de/en only for 1.0?

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
