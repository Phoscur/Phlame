# 0020 — Timewarp: backdating into the unobserved window

Status: accepted (2026-09; implemented the same day: `Empire.enqueue` guard, actions
route clamp, client-side frontier, sandbox rebase in the kit)

## Context

Lazy realtime (ADR 0002) means an empire's snapshot sits at the tick it last observed
(`lastTick`); the ticks since then have not happened _for the empire_ yet. The tick
slider let the player hold the Zeitgeber at an earlier tick and order there
("timewarp"), a "Timewarp to Genesis" toggle extended that all the way back, and the
actions route accepted the client's `at` verbatim. Three semantics resulted:

- The **app** appended entries below earlier ticks without re-deriving state: the log
  was no longer `(tick, seq)`-ordered, `applyLog` sorts, so replay ≠ live — invisible
  only because app sessions carry no genesis to replay from.
- The **kit** (console/MCP) rebased from genesis after a backdated order, but
  `Empire.seq` numbered from the _last row_, which a rebase reorders by tick: duplicate
  seqs (`1, 0, 1`, reproduced in the MCP sandbox) — the total order was gone.
- The **slider's floor** was the last log entry or `0`, so a fresh empire could be
  backdated below its own birth tick.

Rebasing also rewrites the past the player already saw: in the sandbox a backdated mine
put energy at −33/tick for 100 ticks and 2,082 metallic vanished from a stock that had
been displayed — echoes are "never believed" (ADR 0018), but the UI had shown them.

## Decision

- **The observed frontier is `Empire.lastTick`.** Everything below it is immutable.
  `Empire.enqueue` refuses `at < lastTick` (and non-integer ticks). Because enqueue
  fast-forwards to `at`, log ticks never decrease — ADR 0012's ordering holds by
  construction instead of by convention.
- **Backdating into the unobserved window is a feature of lazy realtime, not a cheat.**
  Between the frontier and now nothing has been simulated, so an order placed there is
  exactly as legitimate as one placed now — the idle game's "I was away" made explicit.
  Production allows exactly this and nothing more; the client shows it by rebuilding
  its state from the loaded snapshot plus the log (a build ordered five ticks ago that
  takes four shows up built).
- **The server never orders ahead of its own clock** (ADR 0012 tick authority): the
  route clamps `at` to the server's tick. A client clock running ahead is tolerated,
  not refused.
- **The client tracks the frontier apart from `lastTick`** (`EmpireService.frontier`:
  the loaded snapshot's tick, then the last ordered tick), because client entities
  fast-forward every tick while the server's empire is lazy. The slider's floor is the
  frontier. Corollary: the server must stay lazy on reads (no `update` on render), or
  the window closes — that is deliberate, not an omission.
- **Rebase is single-player only — "sandbox" in both senses.** Today it lives in the
  kit's timewarp lab: a backdated command is slotted into the log at its tick and the
  state re-derived from genesis (`GameSession.rebase`) — replay ≡ live by
  construction, retroactive collisions are the experiment. It becomes a game feature
  (the timewarp slider's genesis extension, behind the player's timewarp setting)
  once the save carries the genesis (persistence v2) — **two-phase**: the change is
  precalculated first, the re-derived state and every echo that moves are shown as a
  diff, and only an explicit accept makes it history. Nothing rewrites in place.
  `Empire.seq` numbers from the highest seq, so a rebased log stays a total order and
  rebases remain _detectable_ as tick/seq inversions (the 2.0 "timewarp detection"
  hook, for free).
- **The frontier is the 1.0 checkpoint.** Explicit checkpoints — log compaction,
  share/export sealing its past, cross-empire observation in 2.0 — generalize it as
  `frontier = max(lastTick, sealed)`: the same guard fed by a persisted `sealed` tick.
  For shared universes that is an _import_ question: from which tick may an imported
  empire's actions start? The import tick seals everything before it — a single-player
  past, rebases included, is history there and never subject to rebase again. Not
  defined until something advances it (persistence v2, open question 4).

## Consequences

- App sessions that used the genesis toggle hold logs with decreasing ticks;
  persistence v2's replay verification will flag them. Pre-1.0 saves may break
  (ADR 0011) — no migration.
- Holding the slider still shows the _present_ economy under an earlier tick label
  (`Zeitgeber.hold` moves the label, never the state). A truthful scrubber is
  `fromGenesis(genesis).applyLog(log, t)` — pure and cheap once the client has the
  genesis (persistence v2). Until then the label lies knowingly.
- `cancel` is client-only and not a log entry, so a rebase — which re-derives from the
  log alone — resurrects cancelled commands. Cancel becomes a command with the
  server-side cancel follow-up (PLAN M1); a hard prerequisite before rebase is a
  feature.
- `at` in the action schema is optional, integer, non-negative. ADR 0002's
  "timewarping" sentence means this window.
