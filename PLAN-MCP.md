# PLAN-MCP.md — the MCP CLI (engine-ui reborn)

Companion plan to [PLAN.md](./PLAN.md)'s side quest: a small **stdio MCP server** that
lets AI agents (and, via inspector, humans) actually *play* the Phlame engine —
deterministically, headless, no browser, no dev server. The spiritual successor of the
old `engine-ui` readline experiments (see [docs/history.md](docs/history.md)).

Not on the 1.0 critical path. Build alongside M1; every piece here must stay a consumer
of the engine's public API — if the MCP server needs engine internals, that's an engine
API smell worth fixing instead (the review already surfaced one: ADR 0014).

## Why (use cases)

- **M0 invariant**: `replay(genesis, log)` ≡ incremental play — as a callable tool, not
  just a spec.
- **M1 debugging**: drive the building queue action by action, inspect the log.
- **M2 balancing**: "play 10k ticks with this build order, show me the curves."
- **Verification**: agents confirm gameplay behavior end-to-end while the SSR/dev-server
  path is broken or irrelevant (the engine is pure — no Vite involved).

## Prerequisites (found in review, 2026-07)

- [x] **Rules as data** ([ADR 0014](docs/decisions/0014-rules-as-data.md) /
      [0015](docs/decisions/0015-phormula-descriptors-pure-building.md), landed 2026-07):
      `Phormulae` value object carries registries, constants, requirements and
      kind-discriminated `Phormula` descriptors; Phelopment (ex-Building, ADR 0016) is
      pure state, Economy interprets. Injection is complete (no `Phormulae.current`), so
      A/B balancing works fully per-instance — even with *differing type registries* in
      one process.
- [ ] **DOM-free config imports**: `src/app/engine/index.ts` re-exports
      `empire.element.tsx` (`extends HTMLElement`) — importing the barrel in plain Node
      crashes without the `html-element` polyfill trick from `src/server.ts`. Split the
      barrel (pure config/factories vs. DOM elements) or import surgically.
- [ ] **Toolchain reach**: `tools/**` is outside `tsconfig.spec.json` include and the
      oxlint scope — add it, so the server is typechecked and linted like everything else.
- [ ] **zod version gate**: repo is on zod 4 (post-upgrade); verify the chosen
      `@modelcontextprotocol/sdk` version supports zod v4 peer-wise *before* installing —
      otherwise pin/alias.

## Design (settled 2026-07 unless marked open)

- **Transport: stdio first.** One tsx script under `tools/mcp/` (no build step, matches
  `npm run preview`'s tsx usage). HTTP later at most — `@hono/mcp` would fit the stack
  if remote agents ever matter.
- **Deterministic time, no running clock.** The server never starts a real Zeitgeber
  loop; ticks advance only via explicit tool calls. The `fakeZeit()` harness in
  [zeitgeber.spec.ts](src/app/signals/zeitgeber.spec.ts) (injected time source + timer
  queue) is the prototype: game time belongs to the agent.
- **In-memory sandbox, multi-session** (keyed by session id, so one agent can A/B two
  empires — two *Phormulae* additionally need ADR 0014 landed). **dump/restore from
  MCP-0**: sessions are process-volatile (stdio restarts lose them), and
  `EmpireJSON` + tick already round-trip — `dump_session`/`restore_session` are nearly
  free insurance for long runs. The agent owns its saves.
- **Timewarp lab.** The sandbox deliberately accepts actions in the past: state is then
  re-derived by replay from genesis. That's the whole point — a laboratory for the
  ADR 0011/0012 semantics (replay, collisions, o.d. catch-up) that production stays
  strict about. Full past-queuing matures with the empire log (MCP-2); until then the
  sandbox is advance-only.
- **advance_ticks v0 is a stopgap**: Empire has no `update()` yet — the wrapper iterates
  entities (`Phlame.update` each) and is explicitly marked provisional; it delegates to
  the empire-level replay orchestration the moment M1 lands (ADR 0012). Watch that the
  wrapper never grows game logic beyond this one loop.
- **Apply-or-discard state swaps.** Engine ops throw (`Invalid resource (re)calculation`,
  type mismatches). Tool handlers build the complete next state from the immutable
  values, swap only on success, and map failures to structured tool errors — a throwing
  move must never leave a half-updated session.
- **Curve output = segment boundaries, not tick samples.** Rates only change at
  `validFor` boundaries, so all curves are piecewise linear — reporting the breakpoints
  is lossless *and* fits agent context windows. 10k-tick dumps are a bug, not a feature.
- **Not part of the rules hash** (ADR 0011): this is tooling, not game rules. Tool
  additions never invalidate saves.
- **Console-UI seed**: the session wrapper (create/load, advance, act, render tables)
  stays MCP-agnostic, so a chalk TUI can later reuse it 1:1 — that's the actual
  "engine-ui reborn" payoff.

## Milestones

### MCP-0 — Scaffold (smallest playable thing)

- [ ] `tools/mcp/server.ts` (stdio) + MCP-agnostic session wrapper around
      `EngineFactory`/`emptyEmpire` (post barrel-split imports).
- [ ] Tools: `new_session(seed?)`, `state(session)` (EmpireJSON + pretty production
      table), `advance_ticks(session, n)` (provisional entity loop, see design),
      `dump_session(session)` / `restore_session(json)`.
- [ ] `.mcp.json` project config + a short `tools/mcp/README.md` (how to attach from
      Claude Code / MCP inspector).
- Done when: an agent creates a session, plays 100 ticks, reads the production table,
  dumps and restores — without touching a browser.

### MCP-1 — Playing moves

- [ ] `upgrade_building(session, planet, type)` / `downgrade_building(...)` — validated
      against `PhelopmentRequirement` costs; failures return clean tool errors (not throws).
- [ ] `list_buildings(session, planet)` with upgrade costs & times (the data the UI shows).

### MCP-2 — Event sourcing hooks (lands with M1's empire log)

- [ ] `show_log(session)` — the empire action log, `(tick, seq)` ordered (ADR 0012).
- [ ] `queue_action(session, action)` — same zod-validated action schema as the server
      route (one schema, two consumers); past ticks allowed → triggers replay (timewarp lab).
- [ ] `replay_check(session)` — run the M0 invariant on the live session; the flagship tool.

### MCP-3 — Balancing instruments (M2 era; A/B unblocked, ADR 0014 injection done)

- [ ] `run_scenario(session, plan, ticks)` — scripted build order, returns
      segment-boundary curves (see design) for plotting & regression comparison.
- [ ] Snapshot/curve diffing between two sessions — A/B balance experiments across
      two Phormulae in one process.

## Open questions

1. **Load real saves?** Read-only `load_session(sid)` from `data/` is useful for
   debugging user reports — gated on two things: the sid sanitization fix (path
   traversal via raw sid, flagged 2026-07 as its own task) and the file-ownership/
   locking answer (ADR 0008 revisit). Until then: sandbox only.
2. **Expose as HTTP** (`@hono/mcp`) for remote/cloud agents — any need before 2.0?
3. **TUI timing**: build the chalk console UI on the session wrapper right after MCP-1,
   or park until an actual human wants it?
4. **Test strategy**: the session wrapper gets unit tests; do the MCP tool handlers need
   their own spec, or is wrapper coverage + manual inspector enough for a dev tool?
