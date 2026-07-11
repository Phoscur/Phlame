# 0014 — Rules as data (lift the engine statics)

Status: accepted (2026-07; **complete**). Steps: `Phormulae` object; lookups moved in as
kind-discriminated `Phormula` descriptors with Building → pure state (ADR 0015); the
Phingerprint (ADR 0011); and finally injection — `Phormulae.current` and all static shims
(`Resource.types`, `Energy.types`, `EnergyCalculation.REBALANCING_EXPONENT`) are gone,
rules are passed explicitly into every `Economy`. No hidden global state remains.

## Context

Every rule-defining constant in the engine is a mutable static: `Resource.types`,
`Energy.types` (registries pushed at config time), `Building.BUILD_TIME_DIVISOR`,
`BuildingRequirement.DOWNGRADECOST_DIVISOR`, `EnergyCalculation.REBALANCING_EXPONENT`.
Three problems, found while reviewing PLAN-MCP:

1. **One rule set per process.** A/B balancing (PLAN-MCP-3) and any multi-universe
   process are impossible — the registries are global.
2. **The rules hash (ADR 0011) has nothing to hash.** Rules scattered across statics and
   module-level pushes have no canonical, serializable representation.
3. **Fixture leak**: `engine/src/lib/resources/examples.ts` pushes `tumbles/salties/blubbs`
   into the registries at module load, and the engine barrel exports it — every consumer
   of `@phlame/engine` gets test fixtures registered in its production type registry.

## Decision

Rules become **instance data**: a `Phormulae` value object (a universe's formula
collection — plural in the Ph tradition of Phlame, singular: Phormula) carrying the
type registries, the tuning constants, and the prosumption/requirement lookups —
explicitly passed/injected where the engine needs it, never mutated statically.
Examples/fixtures build their own local Phormulae; nothing registers globally on import.
The universe rules hash (ADR 0011) is defined as the hash of the canonical Phormulae
serialization — this ADR supplies the missing object.

Pulled forward deliberately (before the MCP server, alongside M1) rather than deferred
to M2 balancing.

## Consequences

- Engine API change: factories/constructors that consult registries or constants take a
  Phormulae (or a context owning one). Migrate stepwise — bundle registries + constants
  first, keep the statics as a deprecated delegation shim until the app is converted,
  then delete the shim.
- `src/app/engine/resources.ts`/`buildings.ts` stop push-mutating and instead _build_
  the app's Phormulae — which is then also the natural answer to "where do balancing
  tables live" (open question: the Phormulae is the canonical, hashable form; code or
  data file is just its storage).
- Prerequisite for PLAN-MCP (multi-session A/B, `run_scenario`) and for M2 balancing.
- Touches the active `game-actions` work — land it before the action log format spreads.

## Injection (the final step, done 2026-07)

Killing `Phormulae.current` took four clean cuts plus one insight:

- `isEnergy` is now instance-based (an `Energy` is energy by construction) — which also
  lets `ResourceProcess.getResourceFor` use `this.limit.isEnergy` instead of a registry.
- `EnergyCalculation` carries its `rebalancingExponent` as a field, threaded from the
  Economy's Phormulae.
- The `Resource` constructor no longer coerces unknown types to Null via the global —
  type validation is the factory/config boundary's job. (`new Resource('x', 0).type` is
  now `'x'`, not Null.)
- `Economy` requires its Phormulae explicitly (no `Phormulae.current` default); every
  construction passes it.
- The one genuinely hard reader was `ResourceCollection.createByType` classifying a bare
  type string as energy, deep in the pure algebra with no Phormulae in scope. Insight:
  the _only_ place that synthesizes an energy placeholder is `Economy.prosumes` (empty
  stock, energy prosumption) — and the Economy has the rules. So `createByType` defaults
  to Resource and the Economy builds energy placeholders from `phormulae.energyTypes`.
  No rule-context had to be threaded through the value-object algebra.

Result: the fixture leak is structurally impossible (no global to leak into), and A/B
with _differing type registries_ now works (no shared global) — the last caveat noted in
PLAN-MCP is resolved.
