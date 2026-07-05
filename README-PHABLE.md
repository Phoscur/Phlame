# Phlame

A nice little single-player idle game in the making — and a deliberate playground for
minimal web technology: [Hono](https://hono.dev/concepts/motivation) SSR with
[JSX](https://hono.dev/jsx#usage), pure
[Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_Components/Using_custom_elements)
with the [Signals polyfill](https://github.com/proposal-signals/signal-polyfill),
[TailwindCSS 4](https://tailwindcss.com/), [HTMX](https://htmx.org/) and
[@joist/di](https://github.com/joist-framework/joist/tree/main/packages/di#di).
No React — don't let the `.tsx` files fool you, that's Hono JSX and great tooling,
not a framework. [AGPLv3](./license.md).

The roadmap — 1.0 milestones and the 2.0 combat/P2P vision — lives in [PLAN.md](./PLAN.md).

## Quick start

- Install [Node.JS](https://nodejs.org) including `npm`
- `git clone` your fork and `npm install`
- `npm start` — develop the app at http://localhost:4200
- `npx vitest` — app unit tests; `npm run test-engine` — engine library tests (watch)
- `npm run e2e` — Playwright end-to-end tests (`npm run ci` starts its own server)
- `npm run build && NODE_ENV=production npm run preview` — production server (tsx)

## Docs

- [CONTEXT.md](./CONTEXT.md) — architecture overview & repo tour
- [engine/CONTEXT.md](./engine/CONTEXT.md) — `@phlame/engine`, the pure economy library
- [docs/tick-flow.md](./docs/tick-flow.md) — how time drives the economy (diagrams)
- [docs/glossary.md](./docs/glossary.md) — domain terms, from Zeitgeber to Prosumer
- [docs/decisions/](./docs/decisions/README.md) — architecture decision records (ADRs)
- [docs/history.md](./docs/history.md) — POC history & learnings since 2008
- [PLAN.md](./PLAN.md) — living roadmap & open questions

Tools: [Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/),
[Playwright](https://playwright.dev/), [TypeScript](https://www.typescriptlang.org/docs/).

## Contribute: start with a fork

The project is under the [AGPLv3 license](./license.md), it requires forking publicly
anyways! Before creating a pull request, please open an issue first. Keep commits small,
focussed and title them starting with a capitalised verb in imperative (e.g. `Add`,
`Change`, `Refactor`).

Please don't suggest adding React — if we ever adopt a framework it's SolidJS (or VanJS;
let's try pure Custom Elements with Signals first). Check
[docs/decisions/](./docs/decisions/README.md) before proposing structural changes, and
[PLAN.md](./PLAN.md) if you are looking for a place to start.

## Motivation

Just around becoming an adult - that was 2008 - I've come along a little OpenSource PHP project inspiring me to [build my own browser game engine](https://ugamela-blog.pheelgood.net/2008/08/30/phlame-engine-ressourcenberechnung-fusionskraftwerkproblem-bauliste-mit-wartefunktion/). However I discovered a long learning path to reach the knowledge for quality, which I actually expect from OpenSource. After studying Computer Science and Information Technology for many years, I'm now working full-time as Software Engineer, gathering reserves to return to a life as a Student one day. Until then I can only sporadically spend my free time on Phlame/UGamela. Today it's a JavaScript/TypeScript project, I've turned away from PHP/SQL in favour of newer foundations.

While this repo is equipped with high coding standards and great development tooling, it's also a playground for new and minimal Web Technology (e.g. Signals Polyfill, Tailwind4, Hono, @joist/di, ...), those packages may still need to mature, but maybe we can help a bit?!

I hope you will also become inspired by Web Technologies and the Galactic Economy Domain, together we may build far beyond the ideas which ([originally](https://ugamela-blog.pheelgood.net/2008/08/21/ugamelas-geschichte/)) [inspired](https://www.owiki.de/index.php/Ugamela) this game! - Phoscur

#

Copyright (C) 2020 Phoscur <phoscur@pheelgood.net> AGPLv3
