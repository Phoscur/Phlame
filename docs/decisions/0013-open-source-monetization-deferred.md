# 0013 — Stays open source (AGPL), monetization deferred

Status: accepted (2026-07)

## Context

Honest stocktake: commercial value of a hobby idle game is near zero; the project's real
value is craft, portfolio and playground. The 2.0 architecture (α universes = forks,
Ω sharing) *is* open source as game mechanics. Legal exposure toward Gameforge/OGame is
low and shrinking: full rewrite, own name, own assets, own balance (M2 decision).

## Decision

- License stays **AGPLv3**; openness is a design pillar, not a default.
- **Monetization is deferred until after 1.0.** Nothing on the 1.0 path may introduce
  lock-in that contradicts ADR 0010 (static-first, forkable saves).
- The one option kept open *now*: copyright stays concentrated — before accepting
  outside contributions, add a DCO (or CLA) so dual-licensing remains possible (M0
  checkpoint in PLAN.md).
- **Blockchain is at most a 2.0+ icebox experiment**, never on the critical path.
  Git (content-addressed, hash-chained history) + universe signatures cover the trust
  needs first (ADR 0011). Recorded concept for later: **stake-gated universes** —
  membership in certain (β/γ) universes requires holding ADA in a designated Cardano
  stake pool. Notably the defensible variant: an entry/sybil cost, not asset
  tokenization, and verifiable by a read-only chain query at signature time (the
  universe gatekeeper signs a genesis only if the wallet proves the stake) — no
  on-chain writes, tokens or NFTs required.

## Consequences

- No accounts, payments or token mechanics in 1.0 milestones.
- Marketing language stays clear of "OGame clone" framing (trademark hygiene);
  mechanics are free, expression (code/assets/text/names) stays original.
- Not legal advice; revisit if the project's audience ever grows beyond hobby scale.
