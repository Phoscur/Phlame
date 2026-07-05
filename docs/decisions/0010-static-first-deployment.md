# 0010 — Static-first deployment, shareable saves

Status: accepted (2026-07)

## Context

The prod server comment in `src/server.ts` already asks: "can we just statically
generate the production server and deploy it to GitHub Pages?!" — static hosting is the
least prohibitive option for a spare-time project. At the same time saves should be
shareable ("share your Speicherstand somewhere/somehow"), which pure client-local
storage doesn't give you.

## Decision

1.0 targets a fully static build (GitHub Pages class hosting): the game runs client-only,
persistence lives in the browser (localStorage/OPFS), the Hono server becomes a dev/SSR
tool rather than a runtime requirement. On top of that, saves must be exportable and
shareable — starting simple (JSON export/import, maybe URL-encoded), growing toward the
git-based sync of the 2.0 vision (service-worker git push, data repos as universes).

## Consequences

- Everything server-side today (session cookies, `data/*.json`, `EngineService`) needs a
  client-side counterpart; the engine is already isomorphic, the services are not yet.
- Global time (ADR 0002's lazy catch-up) must anchor on the client clock in static mode —
  acceptable for single-player, revisit for shared universes (anti-cheat is a 2.0 topic).
- The event log (ADR 0009) is the natural share format: genesis + actions is small,
  diffable and git-friendly — snapshots are just derived caches.
- Server-based multiplayer paths stay possible but are not allowed to block 1.0.
