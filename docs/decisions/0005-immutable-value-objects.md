# 0005 — Immutable value objects, no inheritance

Status: accepted

## Context

The engine's math must be safe to replay over arbitrary tick spans (ADR 0002) and easy to
test. Shared mutable state and deep class hierarchies would make that fragile. An early
experiment with `Object.create`-based prototype chaining for copies was rejected
(debugging pain — see the anecdote comment in `Resource.new`).

## Decision

Everything in the resource layer is an immutable value object: operations (`add`,
`subtract`, `times`, `store`, `fetch`, `calculate`, `upgraded`, `at(speed)`, ...) return
new instances via a `protected new(...)` factory method, which subclass-like consumers
(e.g. the app's `MetallicResource`) override instead of inheriting behavior chains.
Composition over inheritance throughout. Only the entities `Phlame` and `Empire` hold
mutable references (they swap their Economy on update).

## Consequences

- Any point-in-time state can be kept, compared, or thrown away freely — the tick loop
  in `Economy.tick` relies on this.
- `readonly` fields everywhere; a mutating method on a value object is a bug.
- Class explosion is the accepted trade-off; simplification should reduce generics,
  not introduce mutation.
