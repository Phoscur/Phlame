# Tick Flow — how time drives the economy

The one mechanism everything hangs on: a **Zeitgeber** advances a tick counter, and the
economy is only ever recalculated on demand by fast-forwarding from its last known tick
(["lazy realtime"](decisions/0002-lazy-realtime-economy.md)). GitHub and VS Code render
the Mermaid diagrams below inline.

## 1. The Zeitgeber (src/app/signals/zeitgeber.ts)

Runs on both server and client. Every `msPerIteration` (~334ms) it reads wall time and
derives how many whole ticks (`msPerTick`, default 10s) have passed; `tick`, `timeMS` and
`iteration` are Signals, so anything derived updates automatically. `hold(tick)` freezes
the loop for time-travel debugging (TickSlider / "Zeitleiste").

```mermaid
sequenceDiagram
    participant T as setTimeout loop (~334ms)
    participant Z as Zeitgeber
    participant S as Signals (tick, timeMS, iteration)
    participant E as effects / Computed consumers

    loop every msPerIteration
        T->>Z: timeloop()
        Z->>Z: now = timeSource()<br/>ticks = floor((now - currentTime) / msPerTick)
        Z->>S: iteration.set(now)
        alt ticks >= 1
            Z->>S: timeMS.set(+= ticks * msPerTick)<br/>tick.set(+= ticks)
            S-->>E: signal change triggers effects
        end
    end
```

## 2. Server lifecycle (src/server.ts, src/engine.server.ts)

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as Hono server
    participant ES as EngineService
    participant D as Data (./data/*.json)
    participant Emp as EmpireService / EngineFactory

    note over H,D: startup(environment)
    H->>ES: start(env)
    ES->>D: init() + loadZeit()
    ES->>ES: zeit.start(timeMS, tick)  // catches up "o.d." ticks

    note over B,Emp: GET /* (dev flow)
    B->>H: request (cookie sid?)
    alt no sid
        H->>ES: generateSession()
        ES->>D: saveSession({sid, zeit, empire.toJSON()})
        H-->>B: set cookies sid + empire
    else sid present
        H->>ES: load(sid)
        ES->>D: loadSession(sid)
        ES->>Emp: setupFromJSON(empire)  // JSON -> Empire/Phlame/Economy
    end
    H-->>B: SSR HTML, state embedded in element attributes
```

## 3. Client hydration & live updates

`main.ts` registers the custom elements; context elements pull state out of their
attributes and rebuild the same engine objects the server had:

- `empire-ctx` parses its `entities` attribute → `EmpireService.setupFromJSON`
- `ph-ctx` binds one planet → fresh `EconomyService.setup(id)` per element
- `ph-resources` subscribes to the Zeitgeber and drives the actual fast-forward
  (`resources.element.tsx`): `zeit.effect(() => { eco.current.update(tick); ... })`

## 4. Economy.tick(cycles) — the fast-forward core (engine/src/lib/Economy.ts)

`Phlame.update(tick)` computes `cycles = tick - lastTick` and delegates here. The loop
advances in segments: `validFor` says how many ticks the current rates stay truthful
(until some stock hits empty/full or an energy limit); at each boundary the
recalculation strategy halts buildings whose consumption can no longer be met, then
rates are rebuilt.

```mermaid
flowchart TD
    A["tick(cycles)"] --> B{"resources.validFor < cycles?"}
    B -- no --> G["resources.calculate(cycles)<br/>advance remaining ticks"]
    G --> H["new Economy(stock, buildings)"]
    B -- yes --> C["advance by validFor ticks<br/>cycles -= validFor"]
    C --> D["recalculationStrategy:<br/>find unfetchable consumption,<br/>halt affected buildings (speed 0)"]
    D --> E["rebuild EnergyCalculation<br/>from stock + remaining prosumers"]
    E --> F{"validFor == 0?"}
    F -- yes --> X["throw: invalid (re)calculation"]
    F -- no --> B
```

Energy deficit never halts the loop by itself: `EnergyCalculation` instead degrades all
production by `balanceFactor ** 1.1` (deficit multiplier) until the balance recovers —
shown in the UI as "Degraded to N%".

## Invariants worth keeping in mind

- Fast-forwarding N ticks in one call must equal N single-tick updates (integer rates,
  [ADR 0003](decisions/0003-int32-resource-arithmetic.md)).
- `Economy.tick` never mutates — every segment produces new value objects
  ([ADR 0005](decisions/0005-immutable-value-objects.md)); only `Phlame` swaps its economy.
- Client and server run identical engine code on identical JSON — divergence is a bug.
- Persisted snapshots only store `{ zeit, empire }`; everything else is derivable.
