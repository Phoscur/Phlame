# 0019 — Entity ids are strings

Status: accepted (2026-07)

## Context

`ID = string | number` (Action.ts) carried an old indecision ("TODO? use nanoID: string
xor number - I'm leaning towards strings"). With the empire log and save schemas about
to spread the type everywhere (M0), the union gets expensive: JSON keys stringify
anyway, `'1' !== 1` bugs lurk in every comparison, and session/empire ids are already
nanoid strings end to end.

## Decision

`ID = string`, engine-wide. Every entity id (Empire, Phlame, future fleets) is a string —
readable, nanoid-friendly, JSON-stable. The narrowing compiled without a single fix:
no caller ever used a number.

Deliberately out of scope: `PhelopmentIdentifier` stays `string | number` for now — the
engine examples still use the numeric UGamela-era type ids (1, 2, 12, ...); it converges
on strings with the M2 naming pass (the app already uses `mine-metallic` style names).

## Consequences

- The M0 action/log schema (`concerns: ID[]`) builds on strings only.
- The old `server.ts` TODO ("UnitID should be string only") is resolved by the type.
- **Generation is nanoid, at the app boundary only** (`src/app/engine/ids.ts`,
  shared lookalike-free alphabet with session ids, 8 chars): the engine takes ids as
  arguments and never contains randomness (ADR 0009). The previous ad-hoc
  `Math.random().toString(36)` generators (weak, duplicated, and silently shorter on
  trailing zeros) are gone.
- **Type prefixes** (2026-07): generated entity ids are self-explaining —
  `E-XXXXXXXX` empire, `P-XXXXXXXX` planet, `A-XXXXXXXX` action (echo ids become
  `A-XXXXXXXX:started`). A session's empire/planet share its stem (`E-<sid>`/`P-<sid>`).
  Session ids stay bare on purpose: `isValidSID` accepts exactly 8 alphabet chars
  (cookie → file path), so typed entity ids can never pose as sessions.
