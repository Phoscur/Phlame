# 0016 — Building → Phelopment

Status: accepted (2026-07)

## Context

"Everything is a Phlame" (ADR 0012): research/tech will be empire-level buildings via the
same class, fleets later gain ship modules the same way. `Building` was too narrow a name
for "a leveled, prosuming capability of a Phlame entity" — a planet shows it as a building,
an empire as a technology, a fleet as a module.

## Decision

Rename the engine domain concept `Building` → **`Phelopment`** (and `BuildingRequirement`
→ `PhelopmentRequirement`, plus `PhelopmentJSON`/`PhelopmentIdentifier`/`PhelopmentType`/
`PhelopmentFactory`). Semantically it inherits "development" (you develop both buildings
and technologies); the Ph spelling follows Phlame's naming convention: **Ph replaces an F
or V sound** (Phlame←flame, Phormulae←formulae, Phanx←thanks). `Development` has a V, so
`dePhelopment`/`Phelopment` — the shortened `Phelopment` won (visual pun over phonetic;
accepted trade-off). `PhelopmentRequirement` is trivially renamable later if wanted.

**Domain vs. player language stays separate**: `Phelopment` is the engine/model term only.
The i18n layer keeps real words — a Phelopment on a planet is shown to players as a
"Building"/"Gebäude" (`building.*` keys in `i18n.ts` and `planet.element.tsx` were left
untouched on purpose). Future tech/fleet views get their own player words over the same
engine type.

## Consequences

- Mechanical rename across engine + app + specs; two files renamed
  (`Building*.ts` → `Phelopment*.ts`, app `buildings.ts` → `phelopments.ts`). tsc, lint
  and all tests green.
- **Save-format change**: `EconomyJSON`/`PhlameJSON` field `buildings` → `phelopments`.
  Old on-disk session files (`data/session/*.json`) break — acceptable pre-1.0
  (ADR 0011: saves may break, dev universes throwaway); delete a session file to reset.
- Action skeleton payload `buildingID` → `phelopmentID` (no readers yet; M1 defines the
  real schema anyway).
- The naming convention (Ph for F/V) is now explicit for future coinages.
