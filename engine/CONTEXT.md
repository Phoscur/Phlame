# @phlame/engine — Context

Pure, dependency-free TypeScript domain library for the Phlame game economy. Runs on client
and server alike. It models resource flows between buildings and can fast-forward the whole
economy any number of game ticks in one call — the foundation of the "lazy realtime" design:
nothing is simulated in the background, state is recalculated from the last known tick.

Grown carefully since 2020 with near-complete unit test coverage (`*.spec.ts` next to every
module). Vitest, environment: node. Consumed by the app via tsconfig path alias
`@phlame/engine` -> `src/index.ts`.

See also: [../docs/tick-flow.md](../docs/tick-flow.md) (the tick loop with diagrams),
[../docs/glossary.md](../docs/glossary.md), [../docs/decisions/](../docs/decisions/README.md)
(ADRs 0002–0005 cover this library's core choices).

## Design principles

- **Immutable value objects**: every operation (`add`, `subtract`, `times`, `tick`, `upgraded`,
  ...) returns a NEW instance; subclass-friendly via a protected `new(...)` factory method.
  Entities (`Phlame`, `Empire`) are the only mutable-ish objects (they swap their economy).
- **Integer arithmetic**: amounts are int32 (`amount | 0` — fast in v8, avoids float drift);
  negative results clamp to zero; `Infinity` is allowed and explicitly guarded around the
  int32 cast (see `Resource.infinite` / `checkInfinity`).
- **Types as generics**: `ResourceIdentifier` / `BuildingIdentifier` are string(/number)
  unions supplied by the consumer (the app defines metallic/crystalline/liquid/energy).
- **Rules as data** (ADR 0014, in migration): valid types and tuning constants live in the
  `Phormulae` value object (`lib/Phormulae.ts` — a universe's formula collection, singular
  Phormula; canonical `toJSON` for the future rules hash). The old statics
  (`Resource.types`, `Building.BUILD_TIME_DIVISOR`, ...) remain as deprecated shims over
  `Phormulae.current`; config still push-registers through them until injection lands.
  The engine barrel deliberately does NOT export `lib/examples` — its import registers
  fixture types (that leak is fixed and regression-tested).
- Everything is JSON round-trippable: `toJSON()` on each layer, revival is the consumer's
  job (the app's `EngineFactory`). `toString()` everywhere for debugging/console UI.

## Core model (src/lib)

Resource layer (`src/lib/resources/`), composed bottom-up:

- **Resource / Energy** — typed integer amount with compare/add/subtract/times.
  Energy is a separate class (not stored, only balanced); `isEnergy` distinguishes them.
  TODO note in code: merging them into one abstract class is still debated.
- **ResourceCollection / ResourceProcessCollection** — typed maps of the above with
  collection-wide arithmetic.
- **ResourceProcess** — a rate (per tick, rounded to int) toward a limit; knows `endsIn`
  (ticks until the limit is hit) and `after(t)`.
- **Stock** — a ResourceCollection with optional min/max bounds; `store`/`fetch`,
  `getUnfetchable`, limit-aware.
- **Prosumer** — producer+consumer: a set of ResourceProcesses with a speed (0–100%).
- **ResourceCalculation / EnergyCalculation** — the solvers. `validFor` says how many ticks
  the current rates hold; `calculate(t)` advances the stock. EnergyCalculation additionally
  rebalances production when energy is short: `balanceFactor ** 1.1` degrades output.

Game layer (`src/lib/`):

- **Building** — type + level + speed; maps to a Prosumer through `ProsumptionLookup`
  (per-type `level -> rate` functions) and `RequirementLookup` (upgrade/downgrade costs via
  **BuildingRequirement**: `costs * costFactor^level`, plus dependency list).
  `upgradeTime` derives from cost sum / `BUILD_TIME_DIVISOR`.
- **Economy** — Stock + Buildings; `tick(cycles)` loops: advance while rates stay valid,
  then apply `recalculationStrategy` (halt buildings whose consumption can't be met — sets
  their speed to 0) and continue. Named after the entity that owns it.
- **Phlame** — a planet entity: id + Economy + Action list + last tick.
  `update(tick)` fast-forwards the economy. Actions/consequences are still skeletal
  (`Action.ts` is an interface only — timewarping actions are the next roadmap item).
- **Empire** — id + list of Phlames (`lastTick` = max of entities).
- **examples.ts** — shared fixtures for tests and app defaults (`emptyStock`, `buildings`).

## Commands

- `npm test` (here) — vitest watch; `npm run test-engine` from the parent
- `npm run tsc` — typecheck against tsconfig.lib.json
- Build (rarely needed, app imports source directly): vite lib build -> `../dist/engine`

## Known warts / open TODOs (from code comments & readme)

- Resource vs Energy code duplication (deliberately unmerged so far; inheritance avoided).
- Typecasts in `ResourceProcess.add` and `Building.prosumes` lookups marked "TODO fix".
- `Action`/consequence handling in `Phlame.recent`/`update` not implemented yet.
- `Economy.name` may become a seed/ID; `ID = string | number` should probably settle on string.
- Wish list: `as const` instead of enums, less OO/generics weight, maybe BigInt/WASM for
  overflow-safe math.
