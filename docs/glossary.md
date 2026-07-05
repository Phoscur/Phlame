# Glossary

Phlame's domain language, one line each. German loanwords are intentional.

## Time

- **Zeitgeber** — "time-giver": the clock service emitting game ticks as Signals; runs on server and client. (`src/app/signals/zeitgeber.ts`)
- **Zeit** — a `{ tick, timeMS }` snapshot; also what gets persisted to `data/zeit.json`.
- **Zeitgeist** — the Zeitgeber's private bundle of Signal states (tick, timeMS, iteration, hold).
- **Tick** — the game's time unit; default 10s wall time (`msPerTick`). All rates are per tick.
- **Iteration** — the Zeitgeber's inner heartbeat (~334ms) used for smooth UI (progress toward next tick), not for game logic.
- **hold / Zeitleiste** — freezing the Zeitgeber at a chosen tick for time-travel debugging; UI: TickSlider with play/pause.
- **o.d.** — "overdue": ticks elapsed between last persisted Zeit and now, caught up at startup (log shorthand).
- **lazy realtime** — nothing simulates in the background; state fast-forwards from `lastTick` on demand (ADR 0002).

## Economy (engine library)

- **Resource** — immutable integer amount of a type (metallic, crystalline, liquid...); clamps at zero.
- **Energy** — like Resource but never stored, only balanced per tick; may go negative (deficit). (ADR 0004)
- **Stock** — a resource collection with optional min/max limits; `store`/`fetch` respect them.
- **ResourceProcess** — a per-tick rate toward a limit; knows when it `endsIn`.
- **Prosumer** — producer+consumer in one: a building's set of ResourceProcesses running at a speed (0–100%).
- **Prosumption** — a Prosumer's combined production/consumption rates (the lookup maps building level → rate).
- **ResourceCalculation / EnergyCalculation** — the solvers; advance a Stock through time, EnergyCalculation adds energy balancing on top.
- **validFor** — how many ticks the current rates stay valid before some limit is hit; segment boundary of the tick loop.
- **balanceFactor** — production degradation factor on energy deficit (`** 1.1` exponent); UI shows "Degraded to N%".
- **recalculation strategy** — what happens at a segment boundary: buildings with unmeetable consumption are halted (speed 0).
- **Building** — type + level + speed; becomes a Prosumer via prosumption lookup; up/downgrade costs from BuildingRequirement.
- **BuildingRequirement** — costs (`base * costFactor^level`), build time and dependencies for up/downgrades.
- **tumbles, salties, blubbs** — nonsense resource types used as fixtures in engine unit tests (no game meaning).

## World & entities

- **Phlame** — (1) the project/game, (2) `@phlame/engine`, (3) *the* entity class: a planet with id, Economy, actions and lastTick. Context decides.
- **Empire** — a player's collection of Phlames; the unit that gets persisted per session.
- **Economy** — Stock + Buildings of one Phlame; owns the tick fast-forward loop.
- **Action / Consequence** — planned event system (queued action → consequence at a future tick); interface-only so far.
- **Empire log** — the one totally ordered action log per Empire (`(tick, seq)`, `concerns: ID[]` tags); source of truth under event sourcing (ADR 0012).
- **Session / sid** — 8-char nanoid cookie identifying a saved `{ sid, zeit, empire }` snapshot in `data/session/`.

## Universe (vision, 2.0+)

- **α (alpha) universe** — every (git) repo is its own universe.
- **Ω (omega) universe** — accepts all compatible worlds/empires, even pre-cheated ones.
- **β/γ universes** — more serious or distantly forked variants.
- **Ephemeris** — long-term idea: trajectories of heavenly bodies over time; even planetary systems orbit a moving sun — a question of the timeline.
- **UGamela** — the 2008 OpenSource PHP browser game this project descends from.
