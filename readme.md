# NxPhlame

## Easter POC:

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

Questions:

- Is GraphQL the one and only API interface now? Yes
  - favor urql over relay as a client
- Do we want @live if it is not really planned as a spec -> use websockets without socket.io

## Development server

Run `nx serve [app]` for a dev server. Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

Run `npm run dev` to start all three dev servers: app, server & playground.
Run `npm run dev-e2e` to start cypress & the app server.
Run `npm run dev-components-e2e` to start cypress with storybook server.

This project was generated using [Nx](https://nx.dev).

<p align="center"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="450"></p>

🔎 **Nx is a set of Extensible Dev Tools for Monorepos.**

## Adding capabilities to your workspace

Nx supports many plugins which add capabilities for developing different types of applications and different tools.

These capabilities include generating applications, libraries, etc as well as the devtools to test, and build projects as well.

When using Nx, you can create multiple applications and libraries in the same workspace.

Nx core plugins: `@nrwl/react` `@nrwl/nest` `@nrwl/express` `@nrwl/node`

There are also many [community plugins](https://nx.dev/nx-community) you could add.

## Playground and app applications

The command `nx g @nrwl/react:app my-app` was used to generate the applications.

## Generate a library

Run `nx g @nrwl/react:lib my-lib` or `nx g @nrwl/node:lib my-lib` to generate a library.

Then import it as `@phlame/mylib`.

## Generate a component: Code scaffolding

Run `nx g @nrwl/react:component my-component --project=my-app` to generate a new component.

## Build

Run `nx build app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `nx test app` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx affected:test` to execute the unit tests affected by a change.

## Running end-to-end tests

Run `ng e2e app` to execute the end-to-end tests via [Cypress](https://www.cypress.io).

Run `nx affected:e2e` to execute the end-to-end tests affected by a change.

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.
