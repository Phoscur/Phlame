import { inject, injectable } from '@joist/di';
import {
  ComparableResource,
  Economy,
  EconomyJSON,
  Empire,
  Phlame,
  ResourceCollection,
  Stock,
  type StockJSON,
  type BuildingJSON,
  type ID,
  type ResourceJSON,
  PhlameJSON,
} from '@phlame/engine';
import { Zeitgeber } from '../signals/zeitgeber';
import { ResourceFactory, type Types } from './resources';
import { BuildingFactory, type BuildingIdentifier } from './buildings';

export type EmpireEntity = Empire<Types, BuildingIdentifier>;
export type PhlameEntity = Phlame<Types, BuildingIdentifier>;

@injectable
export class EngineFactory {
  #zeit = inject(Zeitgeber);
  #resource = inject(ResourceFactory);
  #building = inject(BuildingFactory);

  createEmpire(
    id: ID,
    entities: Phlame<Types, BuildingIdentifier>[] = [],
  ): Empire<Types, BuildingIdentifier> {
    return new Empire(id, entities);
  }

  createEntities(es: PhlameJSON<Types, BuildingIdentifier>[]): Phlame<Types, BuildingIdentifier>[] {
    return es.map((p) => this.createPhlame(p.id, p.stock, p.buildings));
  }

  createPhlame(
    id: ID,
    stock: StockJSON<Types>,
    // TODO actions
    buildings: BuildingJSON<BuildingIdentifier>[] = [],
  ): Phlame<Types, BuildingIdentifier> {
    const { tick } = this.#zeit();
    return new Phlame(
      id,
      this.createEconomy({
        name: `${id}`,
        stock,
        buildings,
      }),
      [],
      tick,
    );
  }

  createEconomy({
    name,
    stock,
    buildings,
  }: EconomyJSON<Types, BuildingIdentifier>): Economy<Types, BuildingIdentifier> {
    return new Economy(
      name,
      this.createStock(stock),
      buildings.map((b) => this.createBuilding(b)),
    );
  }

  createBuilding(json: BuildingJSON<BuildingIdentifier>) {
    const factory = this.#building();
    return factory.fromJSON(json);
  }

  createStock(json: StockJSON<Types>): Stock<Types> {
    return new Stock(
      this.createResources(json.resources),
      json.max && this.createResources(json.max),
      json.min && this.createResources(json.min),
    );
  }

  createResources(json: ResourceJSON<Types>[]): ResourceCollection<Types> {
    return ResourceCollection.fromArray(json.map((j) => this.createResource(j)));
  }

  createResource(json: ResourceJSON<Types>): ComparableResource<Types> {
    const factory = this.#resource();
    return factory.fromJSON(json);
  }
}
