import { inject, injectable } from '@joist/di';
import { Economy, type EmpireJSON, Entity, Phlame, type ID, ResourceTable } from '@phlame/engine';
import { Empire } from '@phlame/engine';
import { type BuildingIdentifier, defaultBuildings, emptyStock } from './buildings';
import type { ResourceIdentifier } from './resources';
import { type EmpireEntity, EngineFactory } from './factory';

export function emptyEconomy(name: string) {
  return new Economy<ResourceIdentifier, BuildingIdentifier>(name, emptyStock, defaultBuildings);
}
export function emptyPlanet(id: ID, tick?: number) {
  return new Phlame<ResourceIdentifier, BuildingIdentifier>(id, emptyEconomy(`E${id}`), [], tick);
}

export function emptyEmpire(id: ID, planetID: ID, tick?: number) {
  return new Empire<ResourceIdentifier, BuildingIdentifier>(id, [emptyPlanet(planetID, tick)]);
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

@injectable
export class EmpireService {
  #empires = new Repository<Empire<ResourceIdentifier, BuildingIdentifier>>();
  #entities = new Repository<Phlame<ResourceIdentifier, BuildingIdentifier>>();
  #engine = inject(EngineFactory);

  #current = emptyEmpire('Preset', 'defaultPhlame');
  get current() {
    return this.#current;
  }

  getEntity(id: ID): Phlame<ResourceIdentifier, BuildingIdentifier> {
    return this.#entities.find(id);
  }

  setupFromJSON(json: EmpireJSON<ResourceIdentifier, BuildingIdentifier>) {
    const factory = this.#engine();
    const empire = factory.createEmpire(json);
    this.setup(empire);
  }

  setup(empire: EmpireEntity) {
    this.#empires.clear();
    this.#entities.clear();
    this.#current = empire;
    this.#empires.add([this.#current]);
    this.#entities.add(empire.entities);
  }
}

export type ProductionTable = ResourceTable<ResourceIdentifier>;
@injectable
export class EconomyService {
  #empire = inject(EmpireService);

  #phlame = emptyPlanet('presetPhlame');

  get current() {
    return this.#phlame;
  }

  get production(): ProductionTable {
    return this.current.productionTable;
  }

  setup(id: ID) {
    const service = this.#empire();
    this.#phlame = service.getEntity(id);
  }
}
