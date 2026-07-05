# 0004 — Resource and Energy stay separate classes

Status: revisit (questioned in the 2024 self-review and in code TODOs — still standing)

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
- Type guards use `isEnergy` / `Energy.types` registration rather than `instanceof`.
- If a merge ever happens, it supersedes this ADR and must preserve the three semantic
  differences above under test.
