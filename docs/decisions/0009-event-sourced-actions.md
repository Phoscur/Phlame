# 0009 — Event-sourced actions

Status: accepted (2026-07, design in progress)

## Context

Actions (building queue, timewarping consequences) are the next big architectural piece;
`Action.ts` is interface-only so far. Options considered: pure snapshots with a
future-queue (simplest), snapshot + action-log hybrid, or full event sourcing.
The 2.0 vision (shared encrypted snapshots, collision resolution, timewarp detection
after espionage) needs an auditable history anyway.

## Decision

Event sourcing: the action log is the source of truth, state is derived by deterministic
replay from a genesis state. Snapshots (`toJSON` of Empire + Zeit) remain as caches /
checkpoints, not as authority. `Phlame.update(tick)` grows into "replay actions between
lastTick and tick while fast-forwarding the economy".

## Consequences

- Replay must be fully deterministic: integer math (ADR 0003), a defined genesis
  (likely seed-derived — the `Economy` "seed" TODO becomes relevant), and versioned game
  rules, since replaying old logs against changed formulas silently diverges.
- The action schema (ID type, payload shape, engine/rules version field) must be settled
  before persistence formats spread — see PLAN.md open questions.
- Log growth needs compaction (checkpoint snapshot + truncated log) eventually; fine to
  ignore while logs are small.
- 2.0 auditability comes almost for free; cheating detection = replaying someone's log.
