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
  verbs from inside — no recursive agent dispatch.
- Network egress exists for your own model API traffic. Use it for nothing
  else: no downloads, no uploads, no reaching for remotes.

## Rules

1. **Verify through phorge or local fast paths**: `run(test|tsc|lint)` for
   clean-room verdicts, or plain `npm test` / `npx vitest run <file>` /
   `npm run tsc` / `npm run lint` in here for fast TDD. Never install or
   drive a browser in this container — e2e belongs to `run(e2e)`.
2. **Keep the tree honest**: no force pushes, no history rewrites, no
   `git reset --hard`. Commit only if your task says so (small, focused,
   capitalized imperative title — see CLAUDE.md).
3. **Hands off unless tasked**: `.env` (holds your own tokens — reading it
   gains you nothing), `tools/phorge/**`, `compose*.yml`, `Dockerfile*`,
   `.github/**`. These are security-reviewed surfaces; the running
   orchestrator ignores your edits anyway (it runs from a clean checkout).
4. **Your run is bounded**: ~6 minutes, output-capped, one agent slot of two.
   Do one coherent slice; if the task is bigger, finish the slice, leave the
   tree green (tsc + lint + tests), and say what remains.
5. **End with a report**: files changed, what you verified (verbs + exit
   codes), what's left. Your stdout is all the conductor sees — the verdict
   belongs at the END of it.
