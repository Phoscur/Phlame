import { inject, injectable } from '@joist/di';
import { Economy, Entity, Phlame, PhlameJSON, type ID } from '@phlame/engine';
import { Empire } from '@phlame/engine';
import { type BuildingIdentifier, defaultBuildings, emptyStock } from './buildings';
import type { Types } from './resources';
import { EmpireEntity, EngineFactory, PhlameEntity } from './factory';

export function emptyEconomy(name: string) {
  return new Economy<Types, BuildingIdentifier>(name, emptyStock, defaultBuildings);
}
export function emptyPlanet(id: ID) {
  return new Phlame<Types, BuildingIdentifier>(id, emptyEconomy(`E${id}`));
}

export function emptyEmpire(id: ID, planetID: ID) {
  return new Empire<Types, BuildingIdentifier>(id, [emptyPlanet(planetID)]);
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
  #empires = new Repository<Empire<Types, BuildingIdentifier>>();
  #entities = new Repository<Phlame<Types, BuildingIdentifier>>();
  #engine = inject(EngineFactory);

  #current = emptyEmpire('Preset', 'defaultPhlame');
  get current() {
    return this.#current;
  }

  getEntity(id: ID): Phlame<Types, BuildingIdentifier> {
    return this.#entities.find(id);
  }

  setupFromJSON(id: ID, entities: PhlameJSON<Types, BuildingIdentifier>[] = []) {
    const factory = this.#engine();
    const phlames = factory.createEntities(entities);
    const empire = factory.createEmpire(id, phlames);
    this.setup(empire, phlames);
  }

  setup(empire: EmpireEntity, entities: PhlameEntity[] = []) {
    this.#empires.clear();
    this.#entities.clear();
    this.#current = empire;
    this.#empires.add([this.#current]);
    if (entities) {
      this.#entities.add(entities);
    }
  }
}

@injectable
export class EconomyService {
  #empire = inject(EmpireService);

  #current = emptyPlanet('presetPhlame');
  get current() {
    return this.#current;
  }

  setup(id: ID) {
    const service = this.#empire();
    this.#current = service.getEntity(id);
  }
}

export class GameService {}
