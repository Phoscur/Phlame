# AGENTS.md — rules for the containerized yolo agents (agy & claude)

You are running INSIDE the phlame agent container (`IS_SANDBOX=1`), dispatched
headless through a phorge verb or an interactive session. Permissions are
auto-approved in here BY DESIGN — the container wall is your permission
boundary, not a compliment about your judgment. Read [CLAUDE.md](./CLAUDE.md)
for the project itself; this file is about your situation.

## Your situation

- `/phlame` is the developer's REAL working tree (rw bind mount) — your edits
  are real and reviewed as a git diff afterwards. `node_modules` is
  container-private (Linux binaries); `data/` is an empty decoy, real saves
  are unreachable.
- There is NO Docker in here and no path onto the host. The **phorge** MCP
  server (HTTP, preconfigured) is your only door out:
  `status`, `run(test|tsc|lint|e2e|screenshot)`, `screenshot`,
  `logs(service, tail)`, `build`, `down`. Do NOT call the `agy`/`claude`
  verbs from inside — no recursive agent dispatch. Don't call `fmt` either:
  it targets the MAIN tree by default — you have the rw mount, run
  `npx vp fmt` in YOUR tree instead.
- Network egress exists for your own model API traffic. Use it for nothing
  else: no downloads, no uploads, no reaching for remotes.

## Worktree mode

If you were dispatched with a task worktree, your working directory is
`/phlame/.worktrees/<slug>` on branch `agent/<slug>` — a separate checkout
sharing the main repo's `.git`. In that mode:

- **Commit small and often** on YOUR branch (capitalized imperative titles) —
  the commits are how your work is collected and reviewed on the host. The
  "commit only when tasked" rule below applies to the MAIN tree, not here.
- Stay inside your worktree; never edit files under `/phlame` itself.
- Verify with the local fast path (`npx vitest run <file>`, `npm run tsc`,
  `npm run lint` — they resolve node_modules from the parent). The phorge
  `run(...)` verbs test the MAIN worktree, not yours — don't use them to
  verify your branch.
- Leave the worktree in a committed state: uncommitted changes may be lost,
  and the next dispatch (possibly a different agent) continues from your
  last commit.

## Rules

1. **Verify through phorge or local fast paths**: `run(test|tsc|lint)` for
   clean-room verdicts, or plain `npm test` / `npx vitest run <file>` /
   `npm run tsc` / `npm run lint` in here for fast TDD. Never install or
   drive a browser in this container — e2e belongs to `run(e2e)`.
2. **Keep the tree honest**: no force pushes, no history rewrites, no
   `git reset --hard`. Commit only if your task says so — but then commit
   FREQUENTLY: every green step is its own small, focused commit with a
   capitalized imperative title (see CLAUDE.md), not one batch at the end.
3. **Hands off unless tasked**: `.env` (holds your own tokens — reading it
   gains you nothing), `tools/phorge/**`, `compose*.yml`, `Dockerfile*`,
   `.github/**`. These are security-reviewed surfaces; the running
   orchestrator ignores your edits anyway (it runs from a clean checkout).
4. **Your run is bounded**: ~6 minutes, output-capped, one agent slot of two.
   Do one coherent slice; if the task is bigger, finish the slice, leave the
   tree green (tsc + lint + tests), and say what remains.
5. **End with a report**: files changed, commits made (hash + title), what
   you verified (verbs + exit codes), what's left. Your stdout is all the
   conductor sees — the verdict belongs at the END of it.
