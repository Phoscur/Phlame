import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GameSession, type SessionSave } from '../kit/session';

/**
 * Phlame MCP server (PLAN-MCP): lets agents play the engine deterministically.
 * stdio transport - stdout is the protocol channel, so never console.log here;
 * diagnostics go to stderr.
 */
const server = new McpServer({ name: 'phlame-game', version: '0.1.0' });

// in-memory multi-session sandbox (process-volatile by design; dump/restore is the insurance)
const sessions = new Map<string, GameSession>();
let sessionCounter = 0;

function session(id: string): GameSession {
  const found = sessions.get(id);
  if (!found) {
    throw new Error(`Unknown session: ${id} (have: ${[...sessions.keys()].join(', ') || 'none'})`);
  }
  return found;
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function fail(error: unknown) {
  return {
    content: [{ type: 'text' as const, text: error instanceof Error ? error.message : `${error}` }],
    isError: true,
  };
}

server.registerTool(
  'new_session',
  {
    description:
      'Create a fresh in-memory Phlame game session (one empire, one planet, tick 0). Returns the session id and initial state.',
    inputSchema: { name: z.string().optional().describe('empire name, default Sandbox') },
  },
  ({ name }) => {
    const id = `s${++sessionCounter}`;
    const gameSession = GameSession.create(name ?? `Sandbox-${id}`);
    sessions.set(id, gameSession);
    return ok(`session ${id}\n${gameSession.state()}`);
  },
);

server.registerTool(
  'state',
  {
    description:
      'Show a session: tick, stock, production table, phelopments (buildings) and queued actions per planet.',
    inputSchema: { session: z.string().describe('session id from new_session') },
  },
  ({ session: id }) => {
    try {
      return ok(session(id).state());
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'advance_ticks',
  {
    description:
      'Advance game time by n ticks (deterministic fast-forward; queued action consequences apply on the way). Time only moves forward.',
    inputSchema: {
      session: z.string(),
      ticks: z.number().int().positive().describe('number of ticks to advance'),
    },
  },
  ({ session: id, ticks }) => {
    try {
      const gameSession = session(id).advance(ticks);
      return ok(gameSession.state());
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'list_phelopments',
  {
    description:
      'List the phelopments (buildings) of a planet with levels, upgrade costs and build times.',
    inputSchema: { session: z.string(), planet: z.string().optional() },
  },
  ({ session: id, planet }) => {
    try {
      const rows = session(id).list(planet);
      return ok(
        rows
          .map(
            (r) =>
              `${String(r.type).padEnd(18)} L${r.level}${r.speed < 100 ? ` @${r.speed}%` : ''}  upgrade: ${r.upgradeCost} in ${r.upgradeTime} ticks`,
          )
          .join('\n'),
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'grade_phelopment',
  {
    description:
      'Queue a phelopment up- or downgrade (Wartefunktion: waits until the cost is affordable, fetches it, then builds; the estimate self-corrects as ticks pass).',
    inputSchema: {
      session: z.string(),
      type: z.string().describe('phelopment type, e.g. mine-metallic'),
      direction: z.enum(['up', 'down']),
      planet: z.string().optional(),
      at: z.number().int().nonnegative().optional().describe('optional past tick to timewarp the command to'),
    },
  },
  ({ session: id, type, direction, planet, at }) => {
    try {
      const { id: actionId, at: queueAt, duration, wait, cost } = session(id).grade(
        type, 
        direction, 
        planet,
        at
      );
      const waiting =
        wait === Infinity ? 'waiting for production' : wait > 0 ? `wait ~${wait} + ` : '';
      return ok(
        `queued [${actionId}] ${type} ${direction}grade: ~tick ${queueAt} (${waiting}${duration} ticks build, cost ${cost})`,
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'cancel_action',
  {
    description:
      'Remove a queued (not yet completed) action by its id - ids show in state and in the grade_phelopment response.',
    inputSchema: {
      session: z.string(),
      action: z.string().describe('the action id, e.g. K7NQRSTV'),
      planet: z.string().optional(),
    },
  },
  ({ session: id, action, planet }) => {
    try {
      return ok(
        session(id).cancel(action, planet)
          ? `cancelled [${action}]`
          : `nothing queued under [${action}]`,
      );
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'replay_check',
  {
    description:
      'The M0 invariant as a tool: derive a fresh empire from the session genesis, apply the command log, compare with the live state. ok=false means a determinism bug.',
    inputSchema: { session: z.string() },
  },
  ({ session: id }) => {
    try {
      const { ok } = session(id).replayCheck();
      return ok
        ? { content: [{ type: 'text' as const, text: 'ok: replay(genesis, log) ≡ live state' }] }
        : fail('MISMATCH: replay diverged from live state - determinism bug, please report');
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'dump_session',
  {
    description:
      'Serialize a session to its JSON save (carries the universe Phingerprint) - the insurance against server restarts.',
    inputSchema: { session: z.string() },
  },
  ({ session: id }) => {
    try {
      return ok(JSON.stringify(session(id).toJSON(), null, 2));
    } catch (error) {
      return fail(error);
    }
  },
);

server.registerTool(
  'restore_session',
  {
    description:
      'Restore a session from a JSON save produced by dump_session. Refuses saves from a different universe (Phingerprint mismatch).',
    inputSchema: { save: z.string().describe('the JSON save as string') },
  },
  ({ save }) => {
    try {
      const gameSession = GameSession.fromJSON(JSON.parse(save) as SessionSave);
      const id = `s${++sessionCounter}`;
      sessions.set(id, gameSession);
      return ok(`session ${id}\n${gameSession.state()}`);
    } catch (error) {
      return fail(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('phlame-game mcp server ready (stdio)');
