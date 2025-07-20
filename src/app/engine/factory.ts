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
  type PhlameJSON,
  EmpireJSON,
} from '@phlame/engine';
import { ResourceFactory, type ResourceIdentifier } from './resources';
import { BuildingFactory, type BuildingIdentifier } from './buildings';

export type EmpireEntity = Empire<ResourceIdentifier, BuildingIdentifier>;
export type PhlameEntity = Phlame<ResourceIdentifier, BuildingIdentifier>;

@injectable()
export class EngineFactory {
  #resource = inject(ResourceFactory);
  #building = inject(BuildingFactory);

  createEmpire(
    json: EmpireJSON<ResourceIdentifier, BuildingIdentifier>,
  ): Empire<ResourceIdentifier, BuildingIdentifier> {
    return new Empire(json.id, this.createEntities(json.entities));
  }

  createEntities(
    es: PhlameJSON<ResourceIdentifier, BuildingIdentifier>[],
  ): Phlame<ResourceIdentifier, BuildingIdentifier>[] {
    return es.map((p) => this.createPhlame(p.id, p.tick, p.stock, p.buildings));
  }

  createPhlame(
    id: ID,
    tick: number,
    stock: StockJSON<ResourceIdentifier>,
    // TODO actions
    buildings: BuildingJSON<BuildingIdentifier>[] = [],
  ): Phlame<ResourceIdentifier, BuildingIdentifier> {
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
  }: EconomyJSON<ResourceIdentifier, BuildingIdentifier>): Economy<
    ResourceIdentifier,
    BuildingIdentifier
  > {
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

  createStock(json: StockJSON<ResourceIdentifier>): Stock<ResourceIdentifier> {
    return new Stock(
      this.createResources(json.resources),
      json.max && this.createResources(json.max),
      json.min && this.createResources(json.min),
    );
  }

  createResources(
    json: ResourceJSON<ResourceIdentifier>[],
  ): ResourceCollection<ResourceIdentifier> {
    return ResourceCollection.fromArray(json.map((j) => this.createResource(j)));
  }

  createResource(json: ResourceJSON<ResourceIdentifier>): ComparableResource<ResourceIdentifier> {
    const factory = this.#resource();
    return factory.fromJSON(json);
  }
}
