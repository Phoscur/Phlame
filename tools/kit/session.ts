import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injector } from '@joist/di';
import {
  ActionFactory,
  Economy,
  type Action,
  type ActionType,
  type EmpireJSON,
  type TimeUnit,
} from '@phlame/engine';
// deliberately NOT the app barrel (it exports DOM custom elements) - config modules only
import { phormulae, type PhelopmentIdentifier, type Resources } from '../../src/app/engine/phelopments';
import type { ResourceIdentifier } from '../../src/app/engine/resources';
import { emptyEmpire } from '../../src/app/engine/services';
import { generateID } from '../../src/app/engine/ids';
import { EngineFactory, type EmpireEntity, type PhlameEntity } from '../../src/app/engine/factory';

export interface SessionSave {
  name: string;
  tick: TimeUnit;
  /** universe identity (ADR 0011) - refuses to load under different rules */
  phingerprint: string;
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
 * Plays through the real M1 action path: ActionFactory -> Phlame.add -> Phlame.update.
 */
export class GameSession {
  private currentTick: TimeUnit;
  private actionFactory = new ActionFactory();
  private engineFactory = new Injector().inject(EngineFactory);

  constructor(
    readonly name: string,
    readonly empire: EmpireEntity,
    tick: TimeUnit = 0,
  ) {
    this.currentTick = tick;
  }

  static create(name = 'Sandbox', planetID = `${name}-1`, tick: TimeUnit = 0): GameSession {
    return new GameSession(name, emptyEmpire(name, planetID, tick), tick);
  }

  static fromJSON(save: SessionSave): GameSession {
    if (save.phingerprint !== phormulae.phingerprint) {
      throw new Error(
        `Phingerprint mismatch: save is from universe ${save.phingerprint}, ` +
          `current rules are ${phormulae.phingerprint} (ADR 0011 - different rules, different universe)`,
      );
    }
    const factory = new Injector().inject(EngineFactory);
    return new GameSession(`${save.name}`, factory.createEmpire(save.empire), save.tick);
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
      throw new Error(`Unknown planet: ${id} (have: ${this.empire.entities.map((e) => e.id).join(', ')})`);
    }
    return planet;
  }

  /** Advance all entities by n ticks (provisional entity loop until M1's empire-level update) */
  advance(ticks: TimeUnit): this {
    return this.advanceTo(this.currentTick + ticks);
  }

  advanceTo(tick: TimeUnit): this {
    if (tick <= this.currentTick) {
      return this; // time only moves forward
    }
    this.currentTick = tick;
    for (const entity of this.empire.entities) {
      entity.update(tick);
    }
    return this;
  }

  /**
   * Queue an up-/downgrade action (Wartefunktion: costs are fetched once affordable,
   * the build starts then - Phlame.update corrects the estimate as time passes)
   */
  grade(
    type: string,
    direction: 'up' | 'down',
    planetID?: string,
  ): { at: TimeUnit; duration: TimeUnit; wait: TimeUnit; cost: string } {
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
    const at = this.currentTick + (wait === Infinity ? duration : wait + duration);
    // ids are generated here at the tool boundary - the engine stays pure (ADR 0009)
    planet.add(this.actionFactory.updatePhelopment(at, planet, type, direction, generateID()));
    return { at, duration, wait, cost: cost.prettyAmount };
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
          `  queued: ${queued
            .map((a) => `${String(a.consequence.payload.phelopmentID)} ${String(a.consequence.payload.grade)} @${a.consequence.at}`)
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
