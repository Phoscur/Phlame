# tools — play the engine without a browser

The old console `engine-ui` reborn ([PLAN-MCP.md](../PLAN-MCP.md)): a shared, MCP-agnostic
[`kit/session.ts`](kit/session.ts) (`GameSession`) with two thin entries on top. Both play
through the real action path (`ActionFactory` → `Phlame.add` → `Phlame.update`) and carry
the universe [Phingerprint](../docs/decisions/0011-universe-rules-hash.md) in every save.

## Console (for humans)

```
npm run console                     # fresh sandbox, manual ticks
npm run console -- --realtime      # time passes for real (1s/tick, lazy catch-up)
npm run console -- --tickms 200 --realtime
npm run console -- --load mygame   # resume from data/console/mygame.json
```

REPL: `state`, `list`, `tick 100`, `up mine-metallic`, `cancel <id>`, `save mygame`,
`help`, `quit`.
In realtime mode `tick n` timewarps ahead of the clock. Saves live in `data/console/`
(runtime folder, never committed).

## MCP server (for agents)

stdio server, registered in [.mcp.json](../.mcp.json) — Claude Code picks it up as
`phlame` after approval. Tools: `new_session`, `state`, `advance_ticks`,
`list_phelopments`, `grade_phelopment`, `cancel_action`, `dump_session`, `restore_session`.
Sessions are in-memory (dump/restore is the insurance across restarts). Never
`console.log` in the server — stdout is the protocol channel, diagnostics go to stderr.

Inspector: `npx @modelcontextprotocol/inspector npx tsx tools/mcp/server.ts`

## Known limits (honest edges)

- The queue is a FIFO Wartefunktion (2008 semantics): costs are fetched once affordable,
  then the build runs; `at` on a queued action is an estimate that `Phlame.update`
  self-corrects. Queued actions serialize with the save.
- `Phlame.update` still mutates action payloads (`startedAt`, corrected `at`) — the
  decided fix is ADR 0018 (separate `actions[]`/`consequences[]` logs), landing with
  the empire-log rework.
- `advance` iterates entities (provisional until ADR 0012's empire-level update lands).
