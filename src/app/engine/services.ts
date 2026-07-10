import { inject, injectable } from '@joist/di';
import { Economy, type EmpireJSON, Entity, Phlame, type ID, ResourceTable, ActionFactory, Empire } from '@phlame/engine';
import { type PhelopmentIdentifier, defaultPhelopments, phormulae } from './phelopments';
import { type ResourceIdentifier, MetallicResource, CrystallineResource, LiquidResource } from './resources';
import { type EmpireEntity, EngineFactory } from './factory';
import { Stock, ResourceCollection } from '@phlame/engine';

export function emptyEconomy(name: string) {
  const startStock = new Stock<ResourceIdentifier>(
    ResourceCollection.fromArray([
      new MetallicResource(10000),
      new CrystallineResource(10000),
      new LiquidResource(10000),
    ])
  );
  return new Economy<ResourceIdentifier, PhelopmentIdentifier>(
    name,
    startStock,
    defaultPhelopments,
    phormulae,
  );
}
export function emptyPlanet(id: ID, tick?: number) {
  return new Phlame<ResourceIdentifier, PhelopmentIdentifier>(id, emptyEconomy(`E${id}`), [], tick);
}

export function emptyEmpire(id: ID, planetID: ID, tick?: number) {
  return new Empire<ResourceIdentifier, PhelopmentIdentifier>(id, [emptyPlanet(planetID, tick)]);
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
    // estimate: chain behind the newest queued action (chronological FIFO queue);
    // Phlame.update corrects `at` once waiting/start times are actually known
    const lastQueued = planet.upcoming.at(-1);
    const startTick = lastQueued ? lastQueued.consequence.at : planet.lastTick;
    const at = startTick + duration;

    const actionId = Math.random().toString(36).substring(2, 9);
    planet.add(new ActionFactory().updatePhelopment(at, planet, type, direction, actionId));
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
