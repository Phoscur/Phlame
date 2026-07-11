# CLAUDE.md

Read [CONTEXT.md](./CONTEXT.md) for the big picture and [engine/CONTEXT.md](./engine/CONTEXT.md)
for the domain library before touching game logic. [docs/tick-flow.md](./docs/tick-flow.md)
explains the core tick mechanism, [docs/glossary.md](./docs/glossary.md) the domain terms.
[docs/styleguide.md](./docs/styleguide.md) is binding for any UI/styling work.
Architecture decisions live in [docs/decisions/](./docs/decisions/README.md) — check them
before proposing structural changes, and record new decisions as ADRs there.
[PLAN.md](./PLAN.md) is the living roadmap: pick up work from there, tick off what lands,
and move answered open questions into ADRs.

## What this is

Phlame: a browser idle game. This is the standalone repo (GitHub: Phoscur/Phlame); the
older `phlame` monorepo it once lived in is retired as `phlame-legacy`. Two parts:

- `engine/` — `@phlame/engine`, the pure, fully unit-tested economy library (no deps).
- `src/` — the app: Hono SSR server (`src/server.ts`) + Custom Elements client (`src/app/`).

## Commands

- `npm start` — dev server at http://localhost:4200
- `npm test` — all unit tests once (app: jsdom, engine: node)
- `npx vitest run <file>` — single test file; in `engine/`: `npx vitest --watch`
- `npm run tsc` && `npm run lint` — typecheck + lint/format check (Vite+: `vp lint` =
  oxlint, `vp fmt --check` = oxfmt; run both before considering work done)
- `npm run e2e` — Playwright; starts the dev server itself (reuses a running one locally)

**Agents run tests containerized** ([PLAN-CONTAINERS.md](./PLAN-CONTAINERS.md)):
preferred interface is the **phorge** MCP (`status`, `run(test|tsc|lint|e2e|screenshot)`,
`screenshot`, `logs`, `build`, `down`); the npm `:docker` variants (`test:docker` etc.,
first run: `npm run containers:build`) are the fallback. Browser automation NEVER runs
ad hoc on the host — no generated one-off scripts; screenshots go through
`tests/screenshot.spec.ts`. The game sandbox is the separate **phlame-game** MCP
([PLAN-MCP.md](./PLAN-MCP.md)).

## Hard rules

- **No React, no framework.** `.tsx` here is Hono JSX (`jsxImportSource: hono/jsx`) on the
  server and plain Custom Elements + `signal-polyfill` on the client. If a framework were
  ever added it would be SolidJS — but don't.
- **Engine stays pure**: `engine/src` must not import from the app, node, or any package.
  Value objects are immutable — operations return new instances (protected `new()` pattern).
  Every engine module keeps its `*.spec.ts` sibling green and covering new behavior.
- **Integer amounts**: engine arithmetic is int32 (`| 0`) with explicit Infinity handling.
  Don't introduce float amounts or "fix" the `| 0` casts.
- **DI via `@joist/di`**: services are `@injectable()` classes with `inject()`; wire client
  elements through context elements, server through the `Injector` in `engine.server.ts`.
- Commits: small, focused, title starts with a capitalized imperative verb
  (`Add`, `Fix`, `Refactor`, `Update` — see git log).

## Gotchas

- `@phlame/engine` resolves via tsconfig `paths` to `engine/src/index.ts` — source, not a
  built package. No npm workspace; `engine/` has its own tiny package.json for tests only.
- Vite `root` is `src/app`, but the dev server also runs the Hono backend via
  `@hono/vite-dev-server` (entry `src/server.ts`).
- `data/` holds runtime save files (sessions, zeit.json) — never commit or hand-edit while
  the server runs; delete a session file to reset a broken session.
- i18n: user-facing strings go through `src/app/i18n.ts` translations, not hardcoded text.
- Formatting via oxfmt (`npx vp fmt`; options in the `fmt` block of `vite.config.ts`,
  lint rules in `.oxlintrc.json`); match existing style, 100-char-ish lines.
