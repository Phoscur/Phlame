# 0011 — Universe identity = Phingerprint, Ω-first trust

Status: accepted (2026-07; Phingerprint implemented, ADR 0014/0015 landed)

## Context

Event-sourced replay (ADR 0009) silently diverges when game rules (prosumption,
requirement, cost formulas) change under an existing action log. Shared saves (ADR 0010)
additionally need a trust story: when is a foreign save acceptable outside the
anything-goes Ω universe?

## Decision

A **universe is identified by its Phingerprint** — the content hash of its Phormulae (the
rules-as-data of ADR 0014/0015). Implemented as `Phormulae.phingerprint`
(`lib/Phingerprint.ts`): canonical, recursively key-sorted JSON hashed with FNV-1a, so
equal rules hash equally regardless of authoring order. Every save/log carries it; replay
is only defined within a matching Phingerprint. Changing any rule = a new Phingerprint =
a new universe. (Non-cryptographic and 32-bit for now — a collision-cheap identity for the
Ω-first model, wideable later without touching callers.)

Transforming a save across rule sets — "timewarping" a log into another universe — is
expected to be complicated to impossible and is explicitly **out of scope until after
1.0**. The escape hatch always exists: any save can be _ejected into Ω_.

Trust model for now: **everything is Ω** — shared saves are unverified by definition.
Universe signatures (allowing trusted membership in non-Ω universes) are a later idea,
not a commitment.

**Sigil** (deferred, name reserved): where the Phingerprint is _derived_ and therefore
_changes_ when rules evolve, a Sigil would be an **immutable** universe handle — an
assigned origin/lineage reference (provenance, "Herkunftsreferenz") that survives balance
patches, and/or a short stable prefix of the genesis Phingerprint used as a human-friendly
id. Needed once universes are allowed to evolve their rules while staying "the same
universe" (post-1.0); recorded here so the concept and name are not reinvented.

## Consequences

- The rules must be serializable and hashable — pushes the open PLAN question of where
  content/balancing lives (code vs data) toward a canonical, hashable representation.
- Saves may break freely until 1.0; no migration machinery yet.
- The action schema (PLAN M0) carries the universe Phingerprint instead of a vague
  "rules version" field.
- Balancing iteration during development churns hashes — dev universes are throwaway.

## Canonicalization (what "same rules" means for the hash)

The Phingerprint hashes a canonical form so logically-equal rules match:

- **Object keys are sorted recursively** — authoring/insertion order of requirements,
  prosumptions and per-resource formula maps must not affect identity.
- **Type registries (`resourceTypes`/`energyTypes`) are treated as sets** (sorted before
  hashing) — they carry membership, not order; listing the same types differently is the
  same universe.
- **Arrays inside requirements (cost lists) stay ordered** — order there is currently
  treated as significant. Open edge: if two configs list the same costs in a different
  order they hash differently; a deeper set/sequence canonicalization is deferred until
  it actually bites.
- **Float formatting is JS-engine-canonical only** — `buildTimeDivisor = 2500/60`
  serializes deterministically within one JS engine, but a re-implementation in another
  language could format it differently. Irrelevant while only this engine computes the
  Phingerprint; revisit if cross-impl verification (P2P, Sigil provenance) ever needs it.
