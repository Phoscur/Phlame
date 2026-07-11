#!/bin/sh
# Agent-container session setup — runs as the container's start command (see
# compose.agents.yml), so EVERY entry path (npm run agent, docker exec, the
# phorge `agy` verb) finds a configured agy without a wrapper having run first.
#
# Generates the agy MCP config from the container env: agy does not expand
# ${VAR} placeholders in config files, so the literal values are written here —
# into the container-private volume, never onto the host. A token rotation is
# picked up by recreating the container (docker compose up -d --force-recreate).
set -eu

mkdir -p ~/.gemini/config ~/.gemini/antigravity-cli/implicit

cat > ~/.gemini/mcp_config.json <<EOF
{
  "mcpServers": {
    "phorge": {
      "url": "${PHORGE_URL}",
      "headers": { "Authorization": "Bearer ${PHORGE_TOKEN}" }
    }
  }
}
EOF
# agy migrates the legacy path into config/ on startup — write both so a fresh
# volume and an already-migrated one agree.
cp ~/.gemini/mcp_config.json ~/.gemini/config/mcp_config.json

# Copy the ro-mounted host credential seed into agy's live store (rw).
cp -f ~/.gemini/antigravity-cli/implicit-host/*.pb ~/.gemini/antigravity-cli/implicit/ 2>/dev/null || true

# claude: authenticates via CLAUDE_CODE_OAUTH_TOKEN (env) — no files needed.
# The repo .mcp.json carries the HOST-side stdio phorge entry, which cannot work
# in here (no Docker behind the wall) — headless runs therefore use
# `--strict-mcp-config --mcp-config ~/.claude-phorge-mcp.json` with the HTTP
# endpoint instead:
cat > ~/.claude-phorge-mcp.json <<EOF
{
  "mcpServers": {
    "phorge": {
      "type": "http",
      "url": "${PHORGE_URL}",
      "headers": { "Authorization": "Bearer ${PHORGE_TOKEN}" }
    }
  }
}
EOF

# Pre-trust the workspace for claude (fresh volume = fresh ~/.claude.json):
# without it, headless runs ignore .claude/settings.json permissions.
if [ ! -f ~/.claude.json ]; then
  echo '{"projects":{"/phlame":{"hasTrustDialogAccepted":true}}}' > ~/.claude.json
fi

echo "[agent-setup] agy + claude mcp configs generated, credentials seeded"
