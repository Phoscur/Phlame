import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injector } from '@joist/di';
import {
  ActionTypes,
  Economy,
  type Action,
  type ActionType,
  type EmpireJSON,
  type GenesisJSON,
  type TimeUnit,
} from '@phlame/engine';
// deliberately NOT the app barrel (it exports DOM custom elements) - config modules only
import {
  phormulae,
  type PhelopmentIdentifier,
  type Resources,
} from '../../src/app/engine/phelopments';
import type { ResourceIdentifier } from '../../src/app/engine/resources';
import { fromGenesis, genesisFor } from '../../src/app/engine/services';
import { actionID } from '../../src/app/engine/ids';
import { EngineFactory, type EmpireEntity, type PhlameEntity } from '../../src/app/engine/factory';

export interface SessionSave {
  name: string;
  tick: TimeUnit;
  /** universe identity (ADR 0011) - refuses to load under different rules */
  phingerprint: string;
  /** genesis + empire.log is the authoritative save; the snapshot is its cache (ADR 0012/0018) */
  genesis: GenesisJSON;
  empire: EmpireJSON<ResourceIdentifier, PhelopmentIdentifier>;
}

export interface PhelopmentRow {
  type: PhelopmentIdentifier;
  level: number;
  speed: number;
  upgradeCost: string;
  upgradeTime: TimeUnit;
}

const SAVE_FOLDER = join('data', 'console');

/**
 * GameSession - the MCP-agnostic core shared by the console REPL and the MCP server
 * (PLAN-MCP: "engine-ui reborn"). Deterministic: time only advances via advance()/
 * advanceTo(); a realtime driver (console --realtime) owns its own Zeitgeber.
 * Plays through the real M1 path: Empire.enqueue -> projection -> Phlame.update.
 */
export class GameSession {
  private currentTick: TimeUnit;
  private engineFactory = new Injector().inject(EngineFactory);
  public empire: EmpireEntity;

  constructor(
    readonly name: string,
    readonly genesis: GenesisJSON,
    empire: EmpireEntity,
    tick: TimeUnit = 0,
  ) {
    this.empire = empire;
    this.currentTick = tick;
  }

  static create(name = 'Sandbox', planetID = `${name}-1`, tick: TimeUnit = 0): GameSession {
    const genesis = genesisFor(name, [planetID], tick);
    return new GameSession(name, genesis, fromGenesis(genesis), tick);
  }

  static fromJSON(save: SessionSave): GameSession {
    if (save.phingerprint !== phormulae.phingerprint) {
      throw new Error(
        `Phingerprint mismatch: save is from universe ${save.phingerprint}, ` +
          `current rules are ${phormulae.phingerprint} (ADR 0011 - different rules, different universe)`,
      );
    }
    const factory = new Injector().inject(EngineFactory);
    return new GameSession(
      `${save.name}`,
      save.genesis,
      factory.createEmpire(save.empire),
      save.tick,
    );
  }

  get tick(): TimeUnit {
    return this.currentTick;
  }

  get phingerprint(): string {
    return phormulae.phingerprint;
  }

  planet(id?: string): PhlameEntity {
    const planet = id
      ? this.empire.entities.find((e) => `${e.id}` === id)
      : this.empire.entities[0];
    if (!planet) {
      throw new Error(
        `Unknown planet: ${id} (have: ${this.empire.entities.map((e) => e.id).join(', ')})`,
      );
    }
    return planet;
  }

  /** Advance the empire by n ticks on the shared timeline */
  advance(ticks: TimeUnit): this {
    return this.advanceTo(this.currentTick + ticks);
  }

  advanceTo(tick: TimeUnit): this {
    if (tick <= this.currentTick) {
      return this; // time only moves forward
    }
    this.currentTick = tick;
    this.empire.update(tick);
    return this;
  }

  /**
   * The standing M0 invariant as a callable check (PLAN-MCP flagship):
   * derive a fresh empire from genesis, apply the command log, compare snapshots.
   */
  replayCheck(): { ok: boolean; expected: string; actual: string } {
    const expected = JSON.stringify(this.empire.toJSON());
    const replayed = fromGenesis(this.genesis).applyLog(this.empire.log, this.currentTick);
    const actual = JSON.stringify(replayed.toJSON());
    return { ok: actual === expected, expected, actual };
  }

  /**
   * Queue an up-/downgrade action (Wartefunktion: costs are fetched once affordable,
   * the build starts then - Phlame.update corrects the estimate as time passes)
   */
  grade(
    type: string,
    direction: 'up' | 'down',
    planetID?: string,
    atTick?: TimeUnit,
  ): { id: string; at: TimeUnit; duration: TimeUnit; wait: TimeUnit; cost: string } {
    const planet = this.planet(planetID);
    const economy = this.economyView(planet);
    const phelopment = economy.phelopments.find((p) => p.type === type);
    if (!phelopment) {
      throw new Error(
        `Unknown phelopment: ${type} (have: ${economy.phelopments.map((p) => p.type).join(', ')})`,
      );
    }
    const cost =
      direction === 'up' ? economy.upgradeCost(phelopment) : economy.downgradeCost(phelopment);
    const duration =
      direction === 'up' ? economy.upgradeTime(phelopment) : economy.downgradeTime(phelopment);
    const wait = economy.ticksUntilAffordable(cost);

    const queueAt = atTick ?? this.currentTick;
    // display estimate only - actual start/completion are consequence echoes (ADR 0018)
    const at = queueAt + (wait === Infinity ? duration : wait + duration);
    // ids are generated here at the tool boundary - the engine stays pure (ADR 0009)
    const id = actionID();
    // commands enter through the empire's trusted log (ADR 0012)
    this.empire.enqueue(
      ActionTypes.UPDATE,
      { id, phelopmentID: type, grade: direction },
      [planet],
      queueAt,
    );

    if (queueAt < this.currentTick) {
      // Timewarping into the past: re-derive the live state from genesis
      // to ensure costs are evaluated retroactively to maintain the M0 invariant.
      this.empire = fromGenesis(this.genesis).applyLog(this.empire.log, this.currentTick);
    }

    return { id, at, duration, wait, cost: cost.prettyAmount };
  }

  /** Remove a queued action by its id; false if nothing was queued under it */
  cancel(actionId: string, planetID?: string): boolean {
    const planet = this.planet(planetID);
    const before = planet.upcoming.length;
    planet.cancel(actionId);
    return planet.upcoming.length < before;
  }

  list(planetID?: string): PhelopmentRow[] {
    const economy = this.economyView(this.planet(planetID));
    return economy.phelopments.map((p) => ({
      type: p.type,
      level: p.level,
      speed: p.speed,
      upgradeCost: economy.upgradeCost(p).prettyAmount,
      upgradeTime: economy.upgradeTime(p),
    }));
  }

  /** A cost/prosumption view over a planet's current state (values are immutable, this is cheap) */
  protected economyView(planet: PhlameEntity): Economy<Resources, PhelopmentIdentifier> {
    const { stock, phelopments, id } = planet.toJSON();
    return this.engineFactory.createEconomy({ name: `${id}`, stock, phelopments }) as Economy<
      Resources,
      PhelopmentIdentifier
    >;
  }

  upcoming(planetID?: string): Action<ActionType>[] {
    return this.planet(planetID).upcoming;
  }

  /** Render the session state as plain text (console + MCP text content) */
  state(): string {
    const lines = [
      `Empire ${this.empire.id} @ tick ${this.currentTick} [universe ${this.phingerprint}]`,
    ];
    for (const planet of this.empire.entities) {
      const { id, stock, phelopments } = planet.toJSON();
      lines.push(``, `Planet ${id} (tick ${planet.lastTick})`);
      lines.push(`  stock: ${stock.resources.map((r) => `${r.amount} ${r.type}`).join(', ')}`);
      for (const row of planet.productionTable) {
        const [type, rate, amount] = row;
        const sign = rate > 0 ? '+' : '';
        lines.push(`  ${String(type).padEnd(12)} ${sign}${rate}/tick (${amount})`);
      }
      lines.push(
        `  phelopments: ${phelopments.map((p) => `${p.type} L${p.level}${p.speed < 100 ? ` @${p.speed}%` : ''}`).join(', ')}`,
      );
      const queued = planet.upcoming;
      if (queued.length) {
        lines.push(
          `  queued (${queued.length}/${planet.queueSlots}): ${queued
            .map((a) => {
              const actionId = String(a.consequence.payload.id);
              // consequence.at is the orderedAt tick; build progress is an echo (ADR 0018)
              const started = planet.echoes.find((c) => c.id === `${actionId}:started`);
              const status = started ? `building since ${started.at}` : 'waiting';
              return `[${actionId}] ${String(a.consequence.payload.phelopmentID)} ${String(a.consequence.payload.grade)} ordered@${a.consequence.at} (${status})`;
            })
            .join(', ')}`,
        );
      }
    }
    return lines.join('\n');
  }

  toJSON(): SessionSave {
    return {
      name: this.name,
      tick: this.currentTick,
      phingerprint: this.phingerprint,
      genesis: this.genesis,
      empire: this.empire.toJSON(),
    };
  }

  async save(name = this.name): Promise<string> {
    await mkdir(SAVE_FOLDER, { recursive: true });
    const file = join(SAVE_FOLDER, `${sanitize(name)}.json`);
    await writeFile(file, JSON.stringify({ ...this.toJSON(), name }, null, 2));
    return file;
  }

  static async load(name: string): Promise<GameSession> {
    const file = join(SAVE_FOLDER, `${sanitize(name)}.json`);
    const save = JSON.parse(await readFile(file, 'utf8')) as SessionSave;
    return GameSession.fromJSON(save);
  }
}

/** save names become file names - keep them boring (no traversal, see Data sid fix) */
function sanitize(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) {
    throw new Error(`Invalid save name: ${name}`);
  }
  return safe;
}
