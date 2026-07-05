# 0006 — Drop Nx

Status: accepted (done; readme wishlist item checked ~2024/2025)

## Context

The repo was once an Nx workspace (`engine/libs/engine`, `engine/apps/server` — paths
that still linger in the parent `phlame.code-workspace`). Nx brought generators and
caching, but also heavy tooling, config sprawl and upgrade churn for what is effectively
one app plus one small library.

## Decision

Remove Nx. Plain npm scripts orchestrate everything; the `@phlame/engine` library is not
an npm workspace/package but resolved via tsconfig `paths` straight to
`engine/src/index.ts` (with `vite-tsconfig-paths` for Vite/Vitest). The engine keeps its
own minimal `package.json` only for running its tests in isolation.

## Consequences

- One `node_modules`, one lockfile, no build orchestrator to maintain.
- `nx test engine` references in old docs are obsolete — use `npm run test-engine`.
- Leftover artifacts (`project.json`, stale workspace paths) can be cleaned up as touched.
- If the monorepo ever grows real multi-package needs, prefer npm workspaces before
  reaching for a build system again.
