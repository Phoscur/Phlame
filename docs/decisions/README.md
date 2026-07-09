# Architecture Decision Records

Short notes on decisions that shaped this codebase — mostly recovered from readme
self-reviews, code comments and git history (recorded 2026-07). One file per decision,
kept deliberately brief: **Context** (what was the situation), **Decision** (what we do),
**Consequences** (what follows from it).

Statuses: `accepted` — in effect; `revisit` — in effect, but questioned regularly;
`superseded by XXXX` — replaced.

New decisions: copy the format, take the next number, link it from this index.
Reversing a decision gets a *new* ADR that supersedes the old one — don't rewrite history.

## Index

- [0001 — No frontend framework - no React just Hono JSX](0001-no-frontend-framework-no-react-just-hono-jsx.md) `accepted`
- [0002 — Lazy realtime economy](0002-lazy-realtime-economy.md) `accepted`
- [0003 — Integer (int32) resource arithmetic](0003-int32-resource-arithmetic.md) `accepted`
- [0004 — Resource and Energy stay separate classes](0004-resource-energy-separate.md) `revisit`
- [0005 — Immutable value objects, no inheritance](0005-immutable-value-objects.md) `accepted`
- [0006 — Drop Nx](0006-drop-nx.md) `accepted`
- [0007 — No GraphQL](0007-no-graphql.md) `accepted`
- [0008 — File-based JSON persistence (interim)](0008-file-based-persistence.md) `revisit`
- [0009 — Event-sourced actions](0009-event-sourced-actions.md) `accepted`
- [0010 — Static-first deployment, shareable saves](0010-static-first-deployment.md) `accepted`
- [0011 — Universe identity = Phingerprint, Ω-first trust](0011-universe-rules-hash.md) `accepted`
- [0012 — Empire owns the action log ("everything is a Phlame")](0012-empire-owns-the-log.md) `accepted`
- [0013 — Stays open source (AGPL), monetization deferred](0013-open-source-monetization-deferred.md) `accepted`
- [0014 — Rules as data (lift the engine statics)](0014-rules-as-data.md) `accepted`
- [0015 — Phormula descriptors, Building becomes pure state](0015-phormula-descriptors-pure-building.md) `accepted`
- [0016 — Building → Phelopment](0016-phelopment-rename.md) `accepted`
- [0017 — Keep Tailwind 4, style via domain tokens](0017-keep-tailwind-domain-tokens.md) `accepted`
