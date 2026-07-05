# History & POC learnings

The project's paper trail since 2008 — what was tried, what was learned, what was
dropped. Current direction lives in [PLAN.md](../PLAN.md); binding decisions in
[decisions/](decisions/README.md).

## 2008 — Origins: the Fusionskraftwerkproblem

Phlame began as a PHP browser-game engine inspired by UGamela
([engine blog post](https://ugamela-blog.pheelgood.net/2008/08/30/phlame-engine-ressourcenberechnung-fusionskraftwerkproblem-bauliste-mit-wartefunktion/),
[UGamela's history](https://ugamela-blog.pheelgood.net/2008/08/21/ugamelas-geschichte/),
[owiki](https://www.owiki.de/index.php/Ugamela)).

The discovery that started the whole economy engine: UGamela's resource calculation was
simply `production × time`, ignoring lower bounds — max out the fusion plant, set the
deuterium extractor to zero, and watch deuterium go negative ("MinusDeut?!"). Fixing it
properly meant supporting buildings whose drain exceeds production and scarce resources
that only some buildings consume — today's `validFor` segmentation + recalculation
strategy in `EnergyCalculation`/`Economy.tick` is the direct descendant of that insight.
The first fix was a PHP class, then (on meikel's urging, against initial "impossible in
SQL" resistance) a MySQL stored procedure — statically typed per resource, with PHP
templating extra resource sorts into the script before storing it. The procedure is
presumed lost on a backup drive; considered purely nostalgic — the TS engine solves the
problem more generally and under test.

Remarkably, the 2008 post already names the three per-click update layers —
Ressourcenberechnung, Bauliste (with Wartefunktion), Eventhandler — which map 1:1 to
today's architecture: resource/energy calculation, the M1 building queue, and
event-sourced actions (ADR 0009/0012). Even ship refueling as a countdown resource
prefigures fleets-as-Phlames (fuel = negative ResourceProcess, ADR 0012).

The rewrite eventually turned away from PHP/SQL toward TypeScript foundations.

## 2021 — First Easter POC (GraphQL/React)

- `@live`/`@stream` GraphQL queries over resources, console & React component consumers.
- Decided against GraphQL (and with it React) for the complexity it adds — explicitly
  *not* a verdict on the tech ([ADR 0007](decisions/0007-no-graphql.md)).
- Early game-model draft from that era: resources (iron/silicon/hydrogen/electricity,
  later lithium/heat), buildings (mines, silos, research, build-faster, fusion) —
  since evolved into the category types in `src/app/engine/resources.ts`.

## Pre-2024 — Engine roadmap (all core items landed)

Solve resource & energy calculation per tick ✓, unit-tested economy engine ✓; the rest
(idle game loop, persistence, UI, fleet, combat) graduated into PLAN.md milestones.
The 2024 self-review pondering a Resource/Energy merge is now
[ADR 0004](decisions/0004-resource-energy-separate.md) (`revisit`).

## 2024 — Easter POC (the current app takes shape)

- HTMX + Tailwind 4 alpha GUI — no React, no GraphQL, not even VanJS: pure Custom
  Elements, hydrated from SSR attributes.
- Signals (draft polyfill) wired through `@joist/di`; the Zeitgeber emits game ticks.

### Tailwind 4 alpha learnings

- Nice and simplistic, but not beginner friendly yet (ecosystem & dark mode not ready).
- First use of a newly generated utility class escapes live reload — manual refresh.
- CSS counter transitions with `--vars` didn't work in Firefox at the time
  (edit 2025: they do now :D).

## Wishlist ledger

Done: Zeitleiste/TickSlider ✓, session switcher ✓, dropped Cypress ✓, dropped Nx ✓
([ADR 0006](decisions/0006-drop-nx.md)). Still open items moved to PLAN.md
(e2e coverage → M0/M3) or its Icebox (Bun, component tests, VanJS/SolidJS evaluation,
dropping TypeScript for the app build).

## Naming ideas parked over the years

Action & Consequence, GameUnit/GameEntity, Industry/Construction/Investment,
HeavenlyBody, World, Planet/SolarSystem, Universe & PhlameBlock, Ephemeris — several of
these have since landed in the [glossary](glossary.md) or ADRs; the rest wait here.
