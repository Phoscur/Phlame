# Phlame — Context

Phlame is a browser-based idle/strategy game (inspired by UGamela, an old OpenSource PHP browser
game) built as a playground for minimal, modern web technology: no React, no framework — just
Hono (server + JSX), Custom Elements (Web Components), the TC39 Signals polyfill, HTMX,
TailwindCSS 4 and `@joist/di` for dependency injection. AGPLv3 licensed.

This is the standalone Phlame repository (GitHub: Phoscur/Phlame). It used to live nested
inside an older `phlame` monorepo; that parent has been retired to `phlame-legacy` and its
salvageable pieces rescued to [docs/artifacts/](docs/artifacts/README.md) and
[docs/history.md](docs/history.md).

## Layout

```
phlame/                  <- this repo: the game app ("phlame" package)
├── engine/              <- @phlame/engine: pure domain library (see engine/CONTEXT.md)
├── src/
│   ├── server.ts        <- Hono server entry (dev via @hono/vite-dev-server, prod via tsx)
│   ├── engine.server.ts <- EngineService: session lifecycle, ties Zeitgeber + Data + EmpireService
│   ├── data.server.ts   <- Data: file-based persistence (./data/*.json), nanoid session IDs
│   ├── render.server.tsx, html.element.server.ts, routes.tsx
│   └── app/             <- client app (also the Vite root!)
│       ├── main.ts      <- defines all custom elements, attaches DOMInjector
│       ├── engine/      <- game config + services bridging @phlame/engine into the app:
│       │                   resources.ts (resource types), phelopments.ts (phelopment defs/lookups),
│       │                   factory.ts (JSON -> entities), services.ts (EmpireService, EconomyService)
│       ├── signals/     <- zeitgeber.ts: the Zeitgeber (game-tick clock, Signal-based)
│       ├── tick/        <- clock/tick/percent/slider elements (Zeit debugging UI)
│       └── *.element.tsx<- Custom Elements (app, game, planet, resources, session, i18n, modal)
├── tests/               <- Playwright e2e specs
├── docs/                <- tick-flow.md, glossary.md, history.md, decisions/ (ADRs)
├── data/                <- runtime save files (zeit.json, session/*.json) — do not commit
└── vite.config.ts       <- root: 'src/app', dev server on port 4200
```

Deeper dives: [docs/tick-flow.md](docs/tick-flow.md) (Zeitgeber → Economy.tick, with
diagrams), [docs/glossary.md](docs/glossary.md) (domain terms), and
[docs/decisions/](docs/decisions/README.md) (why things are the way they are).

## Architecture

- **Islands-ish SSR**: Hono renders functional JSX server-side, Custom Elements hydrate from
  attributes on the client. `.tsx` files are Hono JSX (`jsxImportSource: hono/jsx`), NOT React.
- **Zeitgeber** (`src/app/signals/zeitgeber.ts`): the time-giver. Emits game ticks
  (default 10s per tick, ~334ms iteration) as Signals; runs on both server and client.
  The economy is _lazy realtime_: state stores the last tick, and `Phlame.update(tick)`
  fast-forwards the economy by the elapsed ticks on demand.
- **Dependency injection** via `@joist/di`: services are `@injectable()` classes using
  `inject(...)`; server uses `Injector` (see `startup()` in engine.server.ts), client uses
  `DOMInjector` + context elements (`game-ctx`, `zeit-ctx`, `empire-ctx`...).
- **Sessions**: cookie `sid` -> `data/session/<env>-<sid>.json` holding `{ sid, zeit, empire }`.
  `EngineFactory` (src/app/engine/factory.ts) revives the JSON into Empire/Phlame/Economy objects.
- **`@phlame/engine`** is resolved via tsconfig `paths` -> `engine/src/index.ts`
  (no npm link/workspace; `vite-tsconfig-paths` makes it work in Vite/Vitest).

## Commands (run in this folder)

- `npm start` — Vite dev server (app + Hono SSR) on http://localhost:4200
- `npm test` — unit tests (app via jsdom, then engine lib)
- `npm run test-engine` — engine lib tests in watch mode
- `npm run e2e` / `npm run play` — Playwright; the `webServer` config starts/reuses the dev server (`ci` = same, CI never reuses)
- `npm run lint`, `npm run tsc` — oxlint + oxfmt check (Vite+ `vp`) / typecheck
- `npm run build` + `NODE_ENV=production npm run preview` — prod build, served with tsx on port 4000

## Status / direction

Working: i18n, lazy realtime economy, unit-tested engine, session persistence (file-based).
The plan lives in [PLAN.md](PLAN.md): event-sourced actions + building queue next, then
gameplay depth, then a static-first 1.0 release with shareable saves. 2.0 dream: fleets,
combat, P2P universes.
