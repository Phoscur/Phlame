# Phlame Engine App

- Run `npm start` to develop the app or `npx vite`, run `npx vitest` to run unit tests
- RUN `npm run build && NODE_ENV=production npm run preview` to run the server with `tsx` TODO add a rollup config for the [server build](https://blog.devgenius.io/full-stack-development-with-vite-and-hono-1b8c26f48956)
- Run `npm run cypress` to open Cypress for e2e tests
- Run `npm run test-engine` to develop the engine library with unit tests

Note Nx v18: Running `vitest` in watchmode through `nx` seems not to work for now, also `npm run dev-e2e` should run a dev-server whilst executing Cypress but after starting vite nothing else happens

## Hono JSX

Don't think just because there are `.tsx` files in this repo, that we have React! No it's very plain TypeScript, Hono, Custom WebComponents and HTMX - but JSX tooling is great (e.g. syntax highlighting) - maybe we only need the static parts (only functional components). And I haven't even added VanJS yet!

## Easter POC 2024:

- htmx tailwind gui (no react - rather vanjs - and likely no graphql)
- service worker?
- build & tech queues
  -> idle game

### POC (Tailwind 4) Learnings:

- the new alpha is nice and simplistic, but not beginner friendly, as it's ecosystem and dark mode are not ready
- when first using a new generated utility class, live reload does not catch it and one needs to manually refresh again
- do we need `nx`? I'm not sure if it's really a help, it's been quite annoying (neither serving cypress nor vite correctly)

#### Wishlist

- Decide between Playwright & Cypress, we don't need both
- Drop Nx (what do we actually need it for? or do we want Analog/Angular?)
- Component Tests, Playground for different Resource ReCalculation Strategies
- Check out SolidJS or/while staying true to vanilla?
- Check out Signals (Draft Polyfill) - use them with `@joist/di` as Zeitgeber emitting time units / game ticks
- JS Decorators, JS private accessor properties (seem to be a bit too new and clashing with bundlers)
- Drop typescript (build for app, what about the engine?)
- Try Bun again

- Zeitleiste (draggable Zeitgeber Tick/Time Debugger)
- e2e tests with Playwright

## Easter POC 2021:

- @live/@stream query resources, console & react component consumers
- build & tech queues @defer?
  -> idle game

### Game Model:

- Resources: Metals: Iron, Crystalline: Silicon, Liquid Hydrogen/Water, Energy: Electricity, (additional Crystalline: Lithium, Energy: Heat)
- Buildings:
  Mines and Silos for Resources,
  Research for Technology,
  Buildings to build faster,
  Fusion as alternative Energy
