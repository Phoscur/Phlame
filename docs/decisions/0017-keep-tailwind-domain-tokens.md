# 0017 — Keep Tailwind 4, style via domain tokens

Status: accepted

## Context

Tailwind 4 came in with the 2024 Easter POC as an alpha experiment (see
[history](../history.md)) and stuck: ~100 utility class usages across the app elements,
and `src/app/styles.css` is essentially a Tailwind `@theme` config carrying the domain
color system (`crystalline`, `liquid`, `energy`, `metallic`). The maintainer doesn't
know or use Tailwind elsewhere and increasingly delegates UI work to AI agents — which
raised the question whether to keep it.

## Decision

Keep Tailwind 4. Precisely _because_ UI work is AI-delegated: LLMs produce more
consistent, idiomatic Tailwind than hand-rolled CSS, and utility classes are locally
readable in diffs without Tailwind expertise. Tailwind 4 is build-time only (Vite
plugin + CSS), no runtime dependency — compatible with the no-framework stance
(ADR 0001).

To prevent drift across AI sessions, styling is bound by [docs/styleguide.md](../styleguide.md):
chromatic colors only through the domain tokens, neutrals via `slate` (surfaces) and
`gray` (text), dark theme only, reference patterns over new variants.

## Consequences

- The raw color palettes in `styles.css` are token feedstock, not an API — app markup
  never uses `text-red-700` and friends directly.
- New semantic colors are added as `@theme` tokens first.
- Custom Elements stay light-DOM (no `attachShadow`), otherwise global utilities break.
- Light theme (PLAN.md polish item) becomes a token-remapping exercise later, not a
  markup rewrite.
