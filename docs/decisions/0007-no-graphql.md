# 0007 — No GraphQL

Status: accepted (since the first Easter POC 2021)

## Context

The 2021 POC explored `@live`/`@stream` GraphQL queries for resources with console and
React component consumers. It worked, but the schema/resolver/client stack added a lot
of moving parts for a game whose state is one JSON snapshot plus a tick counter.

## Decision

No GraphQL (which also removed the main reason for React, see ADR 0001). State travels
as plain JSON: engine objects serialize via `toJSON()`, the server embeds state into
SSR-rendered attributes, and the client revives it through `EngineFactory`. Live updates
come from the client-side Zeitgeber recalculating locally (ADR 0002), not from
server-pushed subscriptions; htmx-ws is the candidate for future server pushes.

## Consequences

- No schema layer to keep in sync — the `*JSON` interfaces in the engine are the contract.
- Explicitly noted in 2021: React+GraphQL wasn't a *bad* fit, just too much complexity —
  this is a scope decision, not a verdict on the tech.
