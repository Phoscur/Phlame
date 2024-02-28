# NxPhlame

- Run `npm start` to serve the app
- Run `npm run cypress` to open Cypress for e2e tests
- Run `npm run test-engine` to develop the engine library with unit tests

Note Nx v18: Running `vitest` in watchmode through `nx` seems not to work for now, also `npm run dev-e2e` should run a dev-server whilst executing Cypress but after starting vite nothing else happens

## Easter POC 2024:

- htmx tailwind gui (no react - rather vanjs - and likely no graphql)
- service worker?
- build & tech queues
  -> idle game

## Easter POC 2021:

- @live/@stream query resources, console & react component consumers
- build & tech queues @defer?
  -> idle game

### Game Model:

- Resources: Iron, Silicon, Hydrogen/Water, Electricity, (Lithium, Heat)
- Buildings:
  Mines and Silos for Resources,
  Research for Technology,
  Buildings to build faster,
  Fusion as alternative Energy

## Development server

Run `npm run dev` to start all three dev servers: app, server & playground.
Run `npm run dev-e2e` to start cypress & the app server.

This project was generated using [Nx](https://nx.dev).
