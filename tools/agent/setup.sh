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

echo "[agent-setup] agy mcp config generated, credentials seeded"
