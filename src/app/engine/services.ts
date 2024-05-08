import { inject, injectable } from '@joist/di';
import { Economy, Entity, Phlame, type ID } from '@phlame/engine';
import { Empire } from '@phlame/engine';
import { type BuildingIdentifier, defaultBuildings, emptyStock } from './buildings';
import type { Types } from './resources';
import { EngineFactory } from './factory';

export const exampleEconomy = new Economy<Types, BuildingIdentifier>(
  'Phlameplanet',
  emptyStock,
  defaultBuildings,
);
export const examplePhlame = new Phlame<Types, BuildingIdentifier>('a Phlame', exampleEconomy);
export const exampleEmpire = new Empire<Types, BuildingIdentifier>('Phlames', []);

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

  #current = exampleEmpire;
  get current() {
    return this.#current;
  }

  getEntity(id: ID): Phlame<Types, BuildingIdentifier> {
    return this.#entities.find(id);
  }

  setup(id: ID, entities: Phlame<Types, BuildingIdentifier>[] = []) {
    const factory = this.#engine();
    this.#empires.clear();
    this.#entities.clear();
    this.#current = factory.createEmpire(id, entities);
    this.#empires.add([this.#current]);
    if (entities) {
      this.#entities.add(entities);
    }
  }
}

@injectable
export class EconomyService {
  #empire = inject(EmpireService);

  #current = examplePhlame;
  get current() {
    return this.#current;
  }

  setup(id: ID) {
    const service = this.#empire();
    this.#current = service.getEntity(id);
  }
}
