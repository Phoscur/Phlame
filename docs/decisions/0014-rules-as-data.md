# 0014 — Rules as data (lift the engine statics)

Status: accepted (2026-07, work pending)

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

Rules become **instance data**: a `Ruleset` value object (working name) carrying the
type registries, the tuning constants, and the prosumption/requirement lookups —
explicitly passed/injected where the engine needs it, never mutated statically.
Examples/fixtures build their own local Ruleset; nothing registers globally on import.
The universe rules hash (ADR 0011) is defined as the hash of the canonical Ruleset
serialization — this ADR supplies the missing object.

Pulled forward deliberately (before the MCP server, alongside M1) rather than deferred
to M2 balancing.

## Consequences

- Engine API change: factories/constructors that consult registries or constants take a
  Ruleset (or a context owning one). Migrate stepwise — bundle registries + constants
  first, keep the statics as a deprecated delegation shim until the app is converted,
  then delete the shim.
- `src/app/engine/resources.ts`/`buildings.ts` stop push-mutating and instead *build*
  the app's Ruleset — which is then also the natural answer to "where do balancing
  tables live" (open question: the Ruleset is the canonical, hashable form; code or
  data file is just its storage).
- Prerequisite for PLAN-MCP (multi-session A/B, `run_scenario`) and for M2 balancing.
- Touches the active `game-actions` work — land it before the action log format spreads.
