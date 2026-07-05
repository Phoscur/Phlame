# @phlame/engine

Pure, dependency-free TypeScript domain library for the Phlame game economy: immutable
value objects, integer arithmetic, and tick fast-forwarding — usable client- and
server-side alike.

Read [CONTEXT.md](./CONTEXT.md) for the full tour of the model (Resource → Prosumer →
Economy → Phlame → Empire) and [../docs/tick-flow.md](../docs/tick-flow.md) for the core
mechanism with diagrams.

## Tests

- `npm test` (in this folder) — vitest in watch mode
- `npm run test-engine` / `npm run tsc-engine` — one-shot from the repo root
- Every module has a `*.spec.ts` sibling; keep them green and covering new behavior.

## Design & history

Decisions concerning this library: [ADRs](../docs/decisions/README.md) 0002 (lazy
realtime), 0003 (int32 math), 0004 (Resource/Energy separate), 0005 (immutable value
objects), 0009 (event sourcing), 0012 (Empire owns the log). Old roadmaps and the P2P
universe ideas moved to [../docs/history.md](../docs/history.md) and
[../PLAN.md](../PLAN.md).

#

Copyright (C) 2020 Phoscur <phoscur@pheelgood.net>
