## 1.0 Roadmap: A nice little single player idle game

Features:

- ✓ i18n
- ✓ lazy realtime economy
- (timewarping) actions
- building queue
- tech, cool special buildings e.g. faster building
- more & better assets e.g. building images
- colonisation of and transports to new planets

Infrastructure & DevEnv:

- ✓ unit tested economy engine
- e2e tests
- simple persistence (localstorage + file based)
  - hono local storage cache in service worker (proxy server)
  - git data push from service worker
- wait for TailwindCSS 4 stable release? add a light theme too?

#### 2.0: Combat

- ships ships ships - all kinds of spaceships!
- trade (order, deliver & pickup)
- shared encrypted snapshots in common data repos
  - action collision resolution
  - partially prevents timewarping (after espionage)

## Motivation

Just around becoming an adult - that was 2008 - I've come along a little OpenSource PHP project inspiring me to [build my own browser game engine](https://ugamela-blog.pheelgood.net/2008/08/30/phlame-engine-ressourcenberechnung-fusionskraftwerkproblem-bauliste-mit-wartefunktion/). However I discovered a long learning path to reach the knowledge for quality, which I actually expect from OpenSource. After studying Computer Science and Information Technology for many years, I'm now working full-time as Software Engineer, gathering reserves to return to a life as a Student one day. Until then I can only sporadically spend my free time on Phlame/UGamela. Today it's a JavaScript/TypeScript project, I've turned away from PHP/SQL in favour of newer foundations.

While this repo is equipped with high coding standards and great development tooling, it's also a playground for new and minimal Web Technology (e.g. Signals Polyfill, Tailwind4, Hono, @joist/di, ...), those packages may still need to mature, but maybe we can help a bit?!

I hope you will also become inspired by Web Technologies and the Galactic Economy Domain, together we may build far beyond the ideas which ([originally](https://ugamela-blog.pheelgood.net/2008/08/21/ugamelas-geschichte/)) [inspired](https://www.owiki.de/index.php/Ugamela) this game! - Phoscur

# Start with a fork: Contribute

The project is under the [AGPLv3 license](./license.md), it requires forking publicly anyways!

Before creating a Pull-Request, please open an issue first. Keep commits small, focussed and title them starting with a capitalised verb in imperative (e.g. `Add`, `Change`, `Refactor`).

Please don't suggest to add React - if we are going to add any of the known frameworks it's SolidJS! (Let's try pure Custom Elements with Signals first, VanJS is also an option.)
See the wishlist below if you are looking for a place to start.

# Docs

You should be familiar with these dependencies:

- [TypeScript Language](https://www.typescriptlang.org/docs/)
- Dependency Injection: [@joist/di](https://github.com/joist-framework/joist/tree/main/packages/di#di)
- Server: [Hono](https://hono.dev/concepts/motivation) it provides [JSX](https://hono.dev/jsx#usage), [TSX](https://tsx.is/)
- [HTMX](https://htmx.org/) (still evaluating)
- App made of [Custom Elements: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_Components/Using_custom_elements)
  - [TailwindCSS 4 Alpha](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
  - [Signals Polyfill](https://github.com/proposal-signals/signal-polyfill?tab=readme-ov-file#examples)

### Tools:

- [Vite Build](https://vitejs.dev/)
- [Vitest](https://vitest.dev/), [Playwright](https://vitest.dev/)

## Architecture Concept:

- [(Astro) Islands](https://docs.astro.build/en/concepts/islands/)

Well, for realtime economy, we need a nice big island :D

Render functional JSX (Hono) then hyrate Custom Elements from attributes. Choose as fine-grained scope to re-render: e.g refreshing the whole app is possible (for language switching), but also just changing attributes of a subsequent elements. Alternatively event data can be shared by injecting signals (see the [Zeitgeber](./blob/master/src/app/tick/zeit.element.tsx))!

## Prerequisites:

- Install [Node.JS](https://nodejs.org) including `npm`
- `git clone` your fork and `npm install`

# Phlame Engine App

- Run `npm start` to develop the app or `npx vite`, run `npx vitest` to run unit tests
- RUN `npm run build && NODE_ENV=production npm run preview` to run the server with `tsx` (TODO add a rollup config for the [server build](https://blog.devgenius.io/full-stack-development-with-vite-and-hono-1b8c26f48956))
- Run `npm run test-engine` to develop the engine library with unit tests

## Hono JSX

Don't think just because there are `.tsx` files in this repo, that we have React! No it's very plain TypeScript, Hono, Custom WebComponents and HTMX - but JSX tooling is great (e.g. syntax highlighting) - maybe we only need the static parts (only functional components). And I haven't even added VanJS yet!

## Easter POC 2024:

- htmx tailwind4 alpha gui
  - no react, no graphql
  - not even van vanjs yet, just pure custom web components
- Signals (Draft Polyfill)
- used with `@joist/di` as Zeitgeber emitting time units / game ticks

### POC (Tailwind 4) Learnings:

- the new alpha is nice and simplistic, but not beginner friendly, as it's ecosystem and dark mode are not ready
- when first using a new generated utility class, live reload does not catch it and one needs to manually refresh again
- css counter transitions with css --vars (which don't work yet in Firefox)

#### Wishlist

- Zeitleiste (draggable Zeitgeber Tick/Time Debugger)
- Session Switcher Input or Dropdown

- e2e tests with Playwright
- Try Bun again
- Decide between Playwright & Cypress, we don't need both (dropped Cypress ✓)
- ✓ Drop Nx (what do we actually need it for? or do we want Analog/Angular?)
- Check out SolidJS or/while staying true to vanilla?
- Component Tests, Playground for different Resource ReCalculation Strategies
- Drop typescript (build for app, what about the engine?)

## Early (first Easter) POC 2021:

- @live/@stream query resources, console & react component consumers

Decided against this approach and GraphQL usage, because of the additional complexity it adds (that does not mean React+GraphQL would not be a good fit here).

### Game Model:

- Resources: Metals: Iron, Crystalline: Silicon, Liquid Hydrogen/Water, Energy: Electricity, (additional Crystalline: Lithium, Energy: Heat)
- Buildings:
  Mines and Silos for Resources,
  Research for Technology,
  Buildings to build faster,
  Fusion as alternative Energy

#

Copyright (C) 2020 Phoscur <phoscur@pheelgood.net> AGPLv3
