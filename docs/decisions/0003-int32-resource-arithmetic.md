# 0003 — Integer (int32) resource arithmetic

Status: accepted

## Context

JavaScript only has floats. Float resource amounts drift, break equality checks, and
produce inconsistent results when ticks are skipped in bulk (lazy realtime, ADR 0002):
a rate of 0.7 over two skipped ticks must yield the same total as two single ticks.

## Decision

All amounts are int32: constructors cast with `amount | 0` (fast path in v8), negative
Resource amounts clamp to zero, `ResourceProcess` rates are `Math.round`ed. `Infinity` is
the one sanctioned exception — it is smuggled past the constructor via `Object.create`
(`Resource.infinite`) because `Infinity | 0 === 0`, and every operation guards it
explicitly through `checkInfinity()`.

## Consequences

- Equality is exact — no epsilon comparisons anywhere.
- Don't "fix" the `| 0` casts or introduce fractional amounts; scale units instead
  (a finer resource unit or bigger tick).
- Overflow beyond 2^31 is currently unhandled (known TODO; BigInt/WASM ideas exist).
- Energy differs slightly: it may go negative on subtract (deficit), see ADR 0004.
