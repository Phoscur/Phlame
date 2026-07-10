import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools';

/**
 * Phorge — the forge (PLAN-CONTAINERS): orchestration MCP for the containerized
 * runners. stdio transport entry point — stdout is the protocol channel, so
 * never console.log here; diagnostics go to stderr. Tool definitions live in
 * tools.ts (shared with the HTTP entry, server.http.ts).
 */
const server = new McpServer({ name: 'phorge', version: '0.2.0' });
registerTools(server);

await server.connect(new StdioServerTransport());
console.error('phorge mcp server ready (stdio)');
