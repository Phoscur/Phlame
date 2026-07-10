# 0018 — Actions and consequences are separate logs

Status: accepted (2026-07; **implemented** with the empire log the same month —
`Phlame.update` appends idempotent echoes, payload mutation is gone, and the replay
self-test runs as kit `replayCheck` / console `verify` / MCP `replay_check`)

## Context

The Wartefunktion build queue (M1 WIP) made `Phlame.update` write derived runtime state
*into* the stored actions (`payload.startedAt`, corrected `consequence.at`). That breaks
the event-sourcing contract of ADR 0009: the log is no longer the immutable record of
what was *ordered* — replaying a log rewrites it, log hashes become ambiguous, and the
`at` field carried three meanings at once (order estimate, queue filter, actual finish) —
the root of a real expiring-action bug. Mixing system events into one stream (plain
option b) was considered, but derived events inside the trusted log are a cheat gateway:
a forged `BuildStarted@2` would build earlier.

## Decision

Two append-only logs, side by side, structurally separated:

- **`actions[]` — the commands.** Player/agent orders, immutable once appended. This is
  the trusted core: it is what gets hashed, shared and verified (ADR 0011). `update()`
  never writes into an action; `consequence.at` returns to a single meaning (the order's
  target estimate).
- **`consequences[]` — the verifiable echo.** Deterministically produced by `update()`
  while interpreting the rules (started/completed/…, the existing `Event` /
  `EventTypes.CONSEQUENCE` shape), correlated to their order via `actionId`, with
  derived ids (e.g. `${actionId}:started`) — no randomness in the engine.
  A verifier never *believes* consequences; it recomputes them.

Derived definitions:

- **open order** = action without its terminal consequence (by `actionId`) — the
  `upcoming` filter stops abusing `at`.
- **replay self-test**: replaying `actions[]` regenerates `consequences[]`; comparing
  with the stored ones is the M0 invariant check, for free on every load.
- **sharing/compaction**: `consequences[]` may be stripped from shared saves and rotated
  freely; `actions[]` only ever grows (until empire-log compaction, ADR 0012/PLAN).

## Consequences

- **Transition truth**: while saves are snapshot + log-rest (today), *open* consequences
  are state, not cache — a running build's `started` tick is not recoverable from the
  stock snapshot. They must be serialized until saves become genesis + full log (M1);
  only then do they degrade to a pure derivation. Do not strip them earlier.
- Full chronology views ("planet history") need a merge of both arrays over `at`
  (+ tiebreak) — the price of separation.
- The migration must *replace* the payload mutations entirely, not add alongside
  (no double bookkeeping of `startedAt`).
- Implementation lands together with the empire log (ADR 0012), where `upcoming`,
  `cancel` and serialization are reworked anyway — decided now so the M1 WIP stops
  growing into the mutation pattern.
