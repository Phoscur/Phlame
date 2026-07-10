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
`list_phelopments`, `grade_phelopment`, `cancel_action`, `replay_check`,
`dump_session`, `restore_session`.
Sessions are in-memory (dump/restore is the insurance across restarts). Never
`console.log` in the server — stdout is the protocol channel, diagnostics go to stderr.

Inspector: `npx @modelcontextprotocol/inspector npx tsx tools/mcp/server.ts`

## Known limits (honest edges)

- The queue is a FIFO Wartefunktion (2008 semantics): costs are fetched once affordable,
  then the build runs. Commands live in the empire's trusted log (ADR 0012), start and
  completion are consequence echoes (ADR 0018) — `verify`/`replay_check` proves
  `replay(genesis, log) ≡ live state` at any time.
- `cancel` refuses builds that already started (costs are fetched; refunds are M2 work).
- Saves are `{genesis, empire}` — genesis + the log inside `empire` are authoritative,
  the snapshot is their cache.
