# 0008 — File-based JSON persistence (interim)

Status: revisit (explicitly "simple persistence" on the 1.0 roadmap)

## Context

Sessions need to survive restarts, but the game is single-player-first and the long-term
vision is unusual: git repositories as game data storage (`phlame-data`, shared encrypted
snapshots, P2P α/Ω universes — see engine/README ideas). Committing to a database now
would build infrastructure the vision doesn't want.

## Decision

Persistence is plain JSON files handled by `src/data.server.ts`: `data/zeit.json` for
global time, `data/session/<env>-<sid>.json` for `{ sid, zeit, empire }` snapshots.
Session IDs are 8-char nanoids (custom alphabet, ambiguous chars removed). No ORM, no
migrations; corrupt/missing files map to 401/404 error codes.

## Consequences

- Sessions are trivially inspectable and deletable (reset = delete the file); the whole
  format doubles as the future git-storage payload.
- No locking or concurrent-write safety — fine for local dev, a known limit for anything
  multi-user. Validation (zod) is a wished-for TODO; a malformed file currently fails
  late as `SessionCorruptError`.
- Planned next steps per roadmap: localStorage + service-worker cache, git push of data —
  possibly sqlite if relational needs appear. Any of those supersedes this ADR.
