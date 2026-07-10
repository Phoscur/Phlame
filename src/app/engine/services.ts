import { inject, injectable } from '@joist/di';
import {
  Economy,
  type EmpireJSON,
  Entity,
  Phlame,
  type ID,
  ResourceTable,
  ActionTypes,
  Empire,
} from '@phlame/engine';
import type { GenesisJSON } from '@phlame/engine';
import { type PhelopmentIdentifier, defaultPhelopments, phormulae } from './phelopments';
import {
  type ResourceIdentifier,
  MetallicResource,
  CrystallineResource,
  LiquidResource,
} from './resources';
import { type EmpireEntity, EngineFactory } from './factory';
import { actionID } from './ids';
import { Stock, ResourceCollection } from '@phlame/engine';

export function emptyEconomy(name: string) {
  const startStock = new Stock<ResourceIdentifier>(
    ResourceCollection.fromArray([
      new MetallicResource(10000),
      new CrystallineResource(10000),
      new LiquidResource(10000),
    ]),
  );
  return new Economy<ResourceIdentifier, PhelopmentIdentifier>(
    name,
    startStock,
    defaultPhelopments,
    phormulae,
  );
}
export function emptyPlanet(id: ID, tick?: number) {
  // economy name === planet id, so genesis-derived and snapshot-rehydrated empires
  // serialize identically (the replay invariant compares full JSON)
  return new Phlame<ResourceIdentifier, PhelopmentIdentifier>(id, emptyEconomy(`${id}`), [], tick);
}

export function emptyEmpire(id: ID, planetID: ID, tick?: number) {
  return new Empire<ResourceIdentifier, PhelopmentIdentifier>(id, [emptyPlanet(planetID, tick)]);
}

/**
 * The genesis of a new empire under the current rules (M0 schema, ADR 0012)
 */
export function genesisFor(empire: ID, planets: ID[], tick = 0, seed = ''): GenesisJSON {
  return { universe: phormulae.phingerprint, seed, empire, planets, tick };
}

/**
 * Deterministic birth: the same genesis always derives the same starting empire -
 * a save can be just genesis + action log (ADR 0012/0018)
 * @throws on a Phingerprint mismatch (different rules = different universe, ADR 0011)
 */
export function fromGenesis(genesis: GenesisJSON): EmpireEntity {
  if (genesis.universe !== phormulae.phingerprint) {
    throw new Error(
      `Phingerprint mismatch: genesis is from universe ${genesis.universe}, ` +
        `current rules are ${phormulae.phingerprint}`,
    );
  }
  return new Empire<ResourceIdentifier, PhelopmentIdentifier>(
    genesis.empire,
    genesis.planets.map((planetID) => emptyPlanet(planetID, genesis.tick)),
  );
}

export class Repository<T extends Entity> {
  #entities: T[] = [];

  add(entities: T[]) {
    this.#entities.push(...entities);
  }

  clear() {
    this.#entities = [];
  }

  find(id: ID): T {
    for (const e of this.#entities) {
      if (e.id === id) {
        return e;
      }
    }
    throw new Error(`Entity [${id}] not found!`);
  }
}

@injectable()
export class EmpireService {
  #engine = inject(EngineFactory);

  #empires = new Repository<Empire<ResourceIdentifier, PhelopmentIdentifier>>();
  #entities = new Repository<Phlame<ResourceIdentifier, PhelopmentIdentifier>>();
  #jsonBackup?: EmpireJSON<ResourceIdentifier, PhelopmentIdentifier>;

  #current = emptyEmpire('Preset', 'defaultPhlame');
  get current() {
    return this.#current;
  }

  getEntity(id: ID): Phlame<ResourceIdentifier, PhelopmentIdentifier> {
    return this.#entities.find(id);
  }

  setupFromJSON(json: EmpireJSON<ResourceIdentifier, PhelopmentIdentifier>) {
    this.#jsonBackup = json;
    const factory = this.#engine();
    const empire = factory.createEmpire(json);
    return this.setup(empire);
  }

  restoreFromBackup() {
    if (!this.#jsonBackup) throw new Error('Missing JSON Empire Backup');
    return this.setupFromJSON(this.#jsonBackup);
  }

  setup(empire: EmpireEntity) {
    this.#empires.clear();
    this.#entities.clear();
    this.#current = empire;
    this.#empires.add([this.#current]);
    this.#entities.add(empire.entities);
    return this;
  }

  queueGrade(planetId: ID, type: PhelopmentIdentifier, direction: 'up' | 'down') {
    const planet = this.getEntity(planetId);
    const { stock, phelopments } = planet.toJSON();
    const economy = this.#engine().createEconomy({ name: `${planet.id}`, stock, phelopments });

    const phelopment = economy.phelopments.find((p) => p.type === type);
    if (!phelopment) {
      throw new Error(`Unknown phelopment: ${type}`);
    }
    const duration =
      direction === 'up' ? economy.upgradeTime(phelopment) : economy.downgradeTime(phelopment);
    // display estimate only - actual start/completion are consequence echoes (ADR 0018)
    const at =
      planet.lastTick +
      economy.ticksUntilAffordable(
        direction === 'up' ? economy.upgradeCost(phelopment) : economy.downgradeCost(phelopment),
      ) +
      duration;

    const actionId = actionID();
    // the command enters through the empire's trusted log (ADR 0012)
    this.#current.enqueue(
      ActionTypes.UPDATE,
      { id: actionId, phelopmentID: type, grade: direction },
      [planet],
    );
    return { at, duration, actionId };
  }

  cancelGrade(planetId: ID, actionId: string) {
    const planet = this.getEntity(planetId);
    planet.cancel(actionId);
  }
}

export type ProductionTable = ResourceTable<ResourceIdentifier>;
@injectable()
export class EconomyService {
  #empire = inject(EmpireService);

  #phlame = emptyPlanet('presetPhlame');
  #setup = false;

  get current() {
    return this.#phlame;
  }

  get production(): ProductionTable {
    return this.current.productionTable;
  }

  setup(id: ID) {
    if (this.#setup) {
      throw new Error(`EconomyService can only be setup once, ${id} needs a new one`);
      // use e.g. @injectable({ providers: [[EconomyService, { use: EconomyService }]] })
    }
    const service = this.#empire();
    this.#phlame = service.getEntity(id);
    this.#setup = true;
  }
}
