# 0012 — Empire owns the action log ("everything is a Phlame")

Status: accepted (2026-07; **implemented** the same month: `Empire.enqueue`/`applyLog`
with `(tick, seq)` ordering, `Phlame.actions` as projection, `consequence.at` = orderedAt;
the structural "everything is a Phlame" unification still lands with M2 tech)

## Context

Event sourcing (ADR 0009) needs a defined total order. Transports and colonization
concern multiple entities at once — per-planet logs would have to be interleaved
deterministically, recreating the ordering problem by hand. Open questions: is Empire a
container class of its own or "a special Phlame", and must entity history be portable
(ownership transfer)?

## Decision

- **One totally ordered action log per Empire**, ordered by `(tick, seq)` — tick
  non-decreasing, seq strictly monotonic. The Empire is the aggregate root; today's
  per-entity `Phlame.actions` becomes at most a derived projection.
- Every action tags all concerned entities (`concerns: ID[]`), so a per-entity history
  is extractable — but never authoritative.
- **Replay**: process actions in log order; lazily fast-forward each concerned entity's
  economy to the action's tick, then apply — cross-entity actions advance all concerned
  entities first and apply atomically.
- **History never changes owners.** If entities ever switch empires (conquest, trade),
  it happens by transformation/re-creation: the old entity ends in the old log, a new
  entity with a new ID begins in the acquirer's log. IDs are unique per log and never
  reused.
- **"Everything is a Phlame"** is declared intent, executed when tech lands (M2):
  Empire becomes a Phlame with its own economy (research = empire-level buildings via
  the existing Building/Requirement machinery), fleets later become Phlames too
  (cargo hold = Stock with max limits, fuel burn = negative ResourceProcess).
  Aggregate root is a _role_, not a type — exactly one entity per log holds it.
- Cross-empire interaction (2.0) stays protocol-level: correlated entries in both logs,
  ordered by the global tick, deterministic within-tick tiebreak (= the roadmap's
  "action collision resolution"). Empire-internal total order is unaffected.

## Consequences

- The M0 action schema is empire-scoped:
  `{ universe: rulesHash, genesis, actions: [{ seq, tick, type, concerns, payload }] }`.
- Standing invariant test: `replay(genesis, log)` ≡ incremental play, for any tick split.
- `Phlame.update(tick)` grows into empire-level replay orchestration.
- Long-term vision noted in passing: even heavenly bodies move (planetary systems orbit
  their sun, which moves itself) — position as a function of the timeline (Ephemeris
  idea, engine README). Nothing 1.0 depends on it; the uniform entity tree keeps the
  door open.
