import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { parseArgs } from 'node:util';
import { GameSession } from '../kit/session';
import { Zeitgeber } from '../../src/app/signals/zeitgeber';

/**
 * Phlame console (PLAN-MCP: "engine-ui reborn", the human half) - a REPL over the same
 * GameSession kit the MCP server uses. Deterministic by default (`tick n`); with
 * --realtime a real Zeitgeber runs and time passes while you think (lazy catch-up,
 * exactly like the game - ADR 0002).
 */
const { values: flags } = parseArgs({
  options: {
    load: { type: 'string' },
    name: { type: 'string' },
    realtime: { type: 'boolean', default: false },
    tickms: { type: 'string', default: '1000' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const HELP = `phlame console - play the engine from your shell

flags:    --name <empire>   new empire name (default Sandbox)
          --load <save>     resume from data/console/<save>.json
          --realtime        time passes for real (Zeitgeber, lazy catch-up)
          --tickms <ms>     ms per tick in realtime mode (default 1000)

commands: s, state            show empire, stock, production, queue
          ls, list            phelopments with upgrade costs & build times
          t, tick <n>         advance n ticks (also in realtime: timewarp ahead)
          up <type> [planet]  queue an upgrade (waits for costs, then builds)
          down <type> [planet]  queue a downgrade
          cancel <id> [planet]  remove a queued action (ids show in state)
          save [name]         save to data/console/<name>.json
          load <name>         load from data/console/<name>.json
          id, phingerprint    show the universe identity (ADR 0011)
          verify              replay(genesis, log) and compare with the live state
          q, quit             exit`;

if (flags.help) {
  console.log(HELP);
  process.exit(0);
}

let session = flags.load
  ? await GameSession.load(flags.load)
  : GameSession.create(flags.name ?? 'Sandbox');

const msPerTick = Number(flags.tickms) || 1000;
const zeit = flags.realtime
  ? new Zeitgeber(
      session.tick,
      msPerTick,
      Math.min(msPerTick, 334),
      () => Date.now(),
      Date.now(),
      (callback, ms) => Number(setTimeout(callback, ms)),
      (tid) => clearTimeout(tid),
    )
  : undefined;
zeit?.start();

function catchUp() {
  if (zeit) session.advanceTo(zeit.tick);
}

console.log(
  `Phlame [universe ${session.phingerprint}]${zeit ? ` - realtime, ${msPerTick}ms/tick` : ' - manual ticks'}`,
);
console.log(`type "help" for commands\n`);
console.log(session.state());

const rl = readline.createInterface({ input, output });
const prompt = () => {
  catchUp();
  rl.setPrompt(`\nphlame:${session.tick}> `);
  rl.prompt();
};
prompt();

// async iteration handles interactive AND piped stdin (ends cleanly on EOF)
for await (const line of rl) {
  catchUp();
  const [command, ...args] = line.trim().split(/\s+/);
  try {
    switch (command) {
      case '':
        break;
      case 'help':
        console.log(HELP);
        break;
      case 's':
      case 'state':
        console.log(session.state());
        break;
      case 'ls':
      case 'list':
        for (const r of session.list(args[1])) {
          console.log(
            `${String(r.type).padEnd(18)} L${r.level}${r.speed < 100 ? ` @${r.speed}%` : ''}  upgrade: ${r.upgradeCost} in ${r.upgradeTime} ticks`,
          );
        }
        break;
      case 't':
      case 'tick': {
        const n = Number(args[0] ?? 1);
        if (!Number.isInteger(n) || n <= 0)
          throw new Error(`tick needs a positive integer, got: ${args[0]}`);
        if (zeit) {
          // timewarp ahead of realtime: hold the Zeitgeber's view, keep counting from there
          zeit.start(zeit.now, session.tick + n);
        }
        session.advance(n);
        console.log(session.state());
        break;
      }
      case 'up':
      case 'down': {
        const type = args[0];
        if (!type) throw new Error(`usage: ${command} <type> [planet]`);
        const { id, at, duration, wait, cost } = session.grade(
          type,
          command as 'up' | 'down',
          args[1],
        );
        const waiting =
          wait === Infinity ? 'waiting for production, ' : wait > 0 ? `wait ~${wait} + ` : '';
        console.log(
          `queued [${id}] ${type} ${command}grade: ~tick ${at} (${waiting}${duration} ticks build, cost ${cost})`,
        );
        break;
      }
      case 'cancel': {
        if (!args[0])
          throw new Error('usage: cancel <actionId> [planet] (ids show in state/queued)');
        console.log(
          session.cancel(args[0], args[1])
            ? `cancelled [${args[0]}]`
            : `nothing queued under [${args[0]}]`,
        );
        break;
      }
      case 'save': {
        const file = await session.save(args[0]);
        console.log(`saved: ${file}`);
        break;
      }
      case 'load': {
        if (!args[0]) throw new Error('usage: load <name>');
        session = await GameSession.load(args[0]);
        zeit?.start(Date.now(), session.tick);
        console.log(session.state());
        break;
      }
      case 'id':
      case 'phingerprint':
        console.log(`universe ${session.phingerprint}`);
        break;
      case 'verify': {
        const { ok } = session.replayCheck();
        console.log(
          ok
            ? 'ok: replay(genesis, log) ≡ live state'
            : 'MISMATCH: replay diverged from live state - determinism bug, please report',
        );
        break;
      }
      case 'q':
      case 'quit':
      case 'exit':
        rl.close();
        zeit?.stop();
        process.exit(0);
      default:
        console.log(`unknown command: ${command} (try "help")`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
  prompt();
}
zeit?.stop();
process.exit(0);
