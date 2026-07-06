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
- [ ] CI green and enforced (playwright.yml, testCoverage.yml) — e2e smoke as gate.
- [x] DCO sign-off required for contributions — see CONTRIBUTING.md
      ([ADR 0013](docs/decisions/0013-open-source-monetization-deferred.md)).
- [ ] **License guardrail**: decide whether `engine/` switches to Apache-2.0 *before*
      merging the first substantial external engine contribution — after that,
      unilateral relicensing is off the table. Game stays AGPL either way (ADR 0013).

## Milestone 1 — Actions & building queue (the 1.0 core)

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
      2026-07; parent `Loader.json` is historical reference only). Where the tables live
      (code vs data) is still open and feeds the rules hash (ADR 0011).

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

- Ships, ships, ships — fleets, trade (order, deliver & pickup), combat.
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
- [x] `engine/engine/README.md` shrunk to test instructions + pointers (2026-07).
- [ ] Parent `phlame.code-workspace` still references dead Nx paths (`engine/libs/engine`,
      `engine/apps/server`) — fix when touching the workspace file.
