# 0011 — Universe identity = rules hash, Ω-first trust

Status: accepted (2026-07)

## Context

Event-sourced replay (ADR 0009) silently diverges when game rules (prosumption,
requirement, cost formulas) change under an existing action log. Shared saves (ADR 0010)
additionally need a trust story: when is a foreign save acceptable outside the
anything-goes Ω universe?

## Decision

A **universe is pinned to a hash of its rules** (the balancing/formula tables plus the
engine's calculation semantics). Every save/log carries that hash; replay is only defined
within a matching hash. Changing balance = creating a new universe.

Transforming a save across rule sets — "timewarping" a log into another universe — is
expected to be complicated to impossible and is explicitly **out of scope until after
1.0**. The escape hatch always exists: any save can be *ejected into Ω*.

Trust model for now: **everything is Ω** — shared saves are unverified by definition.
Universe signatures (allowing trusted membership in non-Ω universes) are a later idea,
not a commitment.

## Consequences

- The rules must be serializable and hashable — pushes the open PLAN question of where
  content/balancing lives (code vs data) toward a canonical, hashable representation.
- Saves may break freely until 1.0; no migration machinery yet.
- The action schema (PLAN M0) carries the universe rules-hash instead of a vague
  "rules version" field.
- Balancing iteration during development churns hashes — dev universes are throwaway.
