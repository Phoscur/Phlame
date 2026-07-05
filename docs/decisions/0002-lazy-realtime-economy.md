# 0002 — Lazy realtime economy

Status: accepted (core design since 2020/2021)

## Context

An idle game's economy runs "all the time", but simulating every entity every tick on a
server does not scale and is pointless while nobody is looking. The original UGamela/PHP
inspiration recalculated resources on page load; Phlame generalizes that idea.

## Decision

No background simulation. Every entity stores the tick it was last updated at
(`Phlame.lastTick`); the Zeitgeber only advances a tick counter. When state is actually
needed, `Phlame.update(tick)` fast-forwards the economy by the elapsed ticks in one call —
`Economy.tick(cycles)` advances in segments bounded by `validFor` (how long the current
rates stay valid before a stock runs empty/full), applying the recalculation strategy
(halting starved buildings) between segments. See [docs/tick-flow.md](../tick-flow.md).

## Consequences

- Economy math must be deterministic and cheap for arbitrary large tick deltas —
  rates are per-tick integers, not per-frame floats (see ADR 0003).
- Client and server run the exact same calculation; the engine stays isomorphic and pure.
- Actions with future consequences ("timewarping") must be replayed when catching up —
  the planned action queue builds on this (roadmap; `Action.ts` is still an interface).
- Cheating by clock manipulation is a known concern, addressed later via shared snapshots
  (2.0 roadmap), not by trusting wall time.
