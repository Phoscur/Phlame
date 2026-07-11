# 0001 — No frontend framework

Status: accepted (since ~2024 Easter POC)

## Context

Phlame is deliberately a playground for minimal, new web technology. React (plus GraphQL)
was tried in the first 2021 POC and rejected for the complexity it adds. The `.tsx` files
in this repo made contributors assume React more than once.

## Decision

No frontend framework. Server-side rendering with Hono's functional JSX, client-side
interactivity with pure Custom Elements (Web Components) hydrating from attributes, plus
the TC39 `signal-polyfill` for reactivity and HTMX (still under evaluation) for
server-driven swaps. If a framework is ever adopted, the candidates are SolidJS or VanJS —
explicitly not React.

## Consequences

- `.tsx` means Hono JSX (`jsxImportSource: hono/jsx`) — functional, static components only.
- Elements are registered manually in `src/app/main.ts`; DI comes from `@joist/di`'s
  `DOMInjector` with context elements instead of a component tree.
- We accept more boilerplate (attribute parsing, manual effects) in exchange for
  zero framework lock-in and direct use of the platform.
