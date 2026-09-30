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

mkdir -p ~/.gemini/config

# Git identity + trust for agent commits (task worktrees under
# /phlame/.worktrees/<slug> are separate working dirs — the Dockerfile's
# safe.directory=/phlame does not cover them; '*' is fine inside the wall).
git config --global user.name 'phlame-agent'
git config --global user.email 'agent@phlame.internal'
git config --global --replace-all safe.directory '*'

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

# opencode: global config lives in ~/.config/opencode/opencode.json (container home).
# Never write into /phlame/ — opencode.jsonc is tracked in the repo and writing secrets
# there leaves the working tree dirty. The generated config sets mcp.phorge to the HTTP
# remote endpoint; opencode loads this file by default (no OPENCODE_CONFIG needed).
# Config sources merge, but PROJECT config wins over global config — so the tracked
# opencode.jsonc deliberately declares no phorge entry, leaving this generated one in
# effect.
mkdir -p ~/.config/opencode
cat > ~/.config/opencode/opencode.json <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "mcp": {
    "phorge": {
      "type": "remote",
      "url": "${PHORGE_URL}",
      "headers": { "Authorization": "Bearer ${PHORGE_TOKEN}" },
      "enabled": true
    }
  }
}
EOF

echo "[agent-setup] agy + claude + opencode mcp configs generated"
