## 1.0 Roadmap: A nice little single player idle game

Features:

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
- wait for TailwindCSS 4 stable release?

#### 2.0: Combat

- ships ships ships - all kinds of spaceships!
- trade (order, deliver & pickup)
- shared encrypted snapshots in common data repos
  - action collision resolution
  - partially prevents timewarping (after espionage)

# Contribute

Start by forking publicly, as the [AGPL license](./license.md) requires you to do anyways! (Reminder: This license also forbids you to take commercial advantage from this code.)

Before creating a Pull-Request, please open an issue first. Keep commits small and focussed and title them starting with a capitalised verb in imperative (e.g. `Add`, `Change`, `Refactor`).

# Phlame Engine App

- Run `npm start` to develop the app or `npx vite`, run `npx vitest` to run unit tests
- RUN `npm run build && NODE_ENV=production npm run preview` to run the server with `tsx` TODO add a rollup config for the [server build](https://blog.devgenius.io/full-stack-development-with-vite-and-hono-1b8c26f48956)
- Run `npm run cypress` to open Cypress for e2e tests
- Run `npm run test-engine` to develop the engine library with unit tests

Note Nx v18: Running `vitest` in watchmode through `nx` seems not to work for now, also `npm run dev-e2e` should run a dev-server whilst executing Cypress but after starting vite nothing else happens

## Hono JSX

Don't think just because there are `.tsx` files in this repo, that we have React! No it's very plain TypeScript, Hono, Custom WebComponents and HTMX - but JSX tooling is great (e.g. syntax highlighting) - maybe we only need the static parts (only functional components). And I haven't even added VanJS yet!

## Easter POC 2024:

- htmx tailwind4 alpha gui
  - no react, no graphql
  - not even van vanjs yet, just pure custom web components
- Signals (Draft Polyfill)
- used with `@joist/di` as Zeitgeber emitting time units / game ticks
- css counter transitions with css --vars (which don't work yet in Firefox)

### POC (Tailwind 4) Learnings:

- the new alpha is nice and simplistic, but not beginner friendly, as it's ecosystem and dark mode are not ready
- when first using a new generated utility class, live reload does not catch it and one needs to manually refresh again
- do we need `nx`? I'm not sure if it's really a help, it's been quite annoying (neither serving cypress nor vite correctly)

#### Wishlist

- Decide between Playwright & Cypress, we don't need both
- Drop Nx (what do we actually need it for? or do we want Analog/Angular?)
- Component Tests, Playground for different Resource ReCalculation Strategies
- Check out SolidJS or/while staying true to vanilla?
- JS Decorators, JS private accessor properties (seem to be a bit too new and clashing with bundlers/TS)
- Drop typescript (build for app, what about the engine?)
- Try Bun again

- Zeitleiste (draggable Zeitgeber Tick/Time Debugger)
- Session Switcher Input or Dropdown
- e2e tests with Playwright

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

Copyright (C) 2020 Phoscur <phoscur@pheelgood.net>
