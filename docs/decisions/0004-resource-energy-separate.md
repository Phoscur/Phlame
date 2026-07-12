# 0004 — Resource and Energy stay separate classes

Status: confirmed (revisited 2026-07-12 — merge attempted, fights back; separation stands)

## Context

`Energy` duplicates most of `Resource`. The obvious refactorings — inheritance or an
extracted `AbstractResource` — keep coming up (readme self-review 2024, TODOs in
`Resource.ts` and `Energy.ts`).

## Decision

Keep them as two independent classes implementing the shared `ComparableResource`
interface, because their semantics genuinely differ:

- **Energy is not stored, only balanced.** It never sits in a Stock; production and
  consumption must match each tick, and `EnergyCalculation` degrades production
  (`balanceFactor`) on deficit instead of draining a stockpile.
- **Subtraction differs**: Resource clamps at zero, Energy may go negative (deficit).
- **Process limits work differently** for energies (see `EnergyCalculation.energies`).

Inheritance is avoided on principle (ADR 0005), and a merge should only happen as a
simplification (less generics/OO weight), not as deduplication for its own sake.

## Consequences

- Some duplication is accepted and kept in sync by the mirrored spec files.
- Type guards use `isEnergy` / `Energy.types` registration rather than `instanceof`
  (since ADR 0014 the registry is gone: `isEnergy` is class identity).
- If a merge ever happens, it supersedes this ADR and must preserve the three semantic
  differences above under test.

## Revisited 2026-07-12 — merge attempted, fights back

A discovery dry-run ("implement to revert", agent worktree branch `agent/energy-merge`,
evidence commit `080d011`) attempted the merge under the standing constraints (one class
or plain composition, no inheritance/flags/generics — ADR 0005). Both seams were built
and failed:

- **Composition cannot represent deficits.** The clamp lives in the `Resource`
  constructor (`Resource.ts` — `amount < 0 ? 0 : amount | 0`), not in `subtract`. An
  Energy composed over a Resource can never hold a negative balance (semantic 2); its
  value space is simply too narrow.
- **A single class needs a flag.** Since ADR 0014 removed the `Energy.types` registry,
  `isEnergy` is class identity. A unified class must thread an `isEnergy` constructor
  flag through every construction site (the `examples.ts` subclasses break silently by
  defaulting to `false`) — friction by definition, per the merge ground rules above.
- **Side-finding:** the mirrored specs did not pin the deficit semantics directly. The
  `em10` fixture was only compared against equally-constructed instances (`eql`), so a
  clamping implementation passed the suite green. Direct assertions (`amount === -10`)
  are required so the harness actually enforces semantic 2.

Verdict on the merge question: it would be deduplication for its own sake, not a
simplification. The separation stands; status moves from `revisit` to confirmed.
