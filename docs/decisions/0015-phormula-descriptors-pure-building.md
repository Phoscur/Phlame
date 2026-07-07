# 0015 — Phormula descriptors, Building becomes pure state

Status: accepted (2026-07, landed same day)

## Context

Step 3 of ADR 0014: the prosumption/requirement lookups still ride through every
`Building` constructor (the old "full lookup here" TODO), and they are **functions** —
`(lvl) => 30 * lvl * lvl ** 1.1` has no canonical serialization, so the rules hash
(ADR 0011) cannot exist while formulas are code. Two designs were on the table:
Building keeps behavior and holds a Phormulae reference (A), or Building becomes pure
state and the rules layer computes (B). Chosen: **B, with kind-discriminated formula
descriptors from the start.**

## Decision

- **`Phormula`** (the singular earns its name): a serializable, kind-discriminated
  formula descriptor with an `at(level)` evaluator. Initial kinds:
  `{ kind: 'zero' }` and `{ kind: 'polynomial', coefficient, exponent }` evaluating
  `coefficient * level * level ** exponent` (the shape of every current formula).
  Future kinds extend the union (e.g. an environment-aware one for the temperature
  factor sketched in the old Blubber-mine TODO).
- **`Phormulae` stays pure data, zero runtime imports**: registries, tuning constants,
  `requirements` (BuildingRequirement instances) and `prosumptions` (Phormula maps),
  plus lookup accessors and complete canonical `toJSON()`. This is deliberate module
  topology, not taste: `Resource`'s static initializer reads the shim during class
  init — any runtime import from Phormulae into the resources layer creates a
  load-order-dependent TDZ crash. The rule *document* must not import its *interpreter*.
- **`Building` becomes a pure state value object**: `(type, level, speed)` — exactly its
  JSON — keeping only the state operations (`upgraded`, `downgraded`, `at`, `disabled`).
  Costs, times and prosumption move out.
- **`Economy` is the interpreter**: it holds its `phormulae` (constructor parameter,
  defaulting to `Phormulae.current` as the documented bridge until injection) and
  computes `prosumes(building)`, `upgradeCost/Time(type)`, `downgradeCost/Time(type)`
  for the tick loop, the UI and action validation.
- `BuildingRequirement` gains `toJSON()` (costs/costFactor/dependencies are already
  data) so the requirements side of the hash closes too.

## Consequences

- `BuildingJSON` and saves are untouched — lookups were never serialized; factories
  simply stop re-injecting them per instance.
- Call sites shift from `building.prosumes(stock)` / `building.upgradeCost` to
  `economy.prosumes(building)` / `economy.upgradeCost(type)` — engine internals, specs,
  and the app's action/UI layer.
- `Phormulae.toJSON()` becomes complete: the rules hash (ADR 0011) is implementable.
- Balancing A/B in one process works for same-type, different-numbers experiments;
  differing type registries still collide on `Phormulae.current` until injection
  (ADR 0014 step 4) moves constructor type-validation to the config boundary.
- This matches the 2024 self-review's "less object-oriented" wish: behavior
  concentrates in the solver layer, value objects get dumber.
