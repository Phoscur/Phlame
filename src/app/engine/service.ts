import { inject, injectable } from '@joist/di';
import {
  ComparableResource,
  Economy,
  EconomyJSON,
  Empire,
  Phlame,
  ResourceCollection,
  Stock,
  type BuildingJSON,
  type ID,
  type ResourceJSON,
} from '@phlame/engine';
import { Zeitgeber } from '../signals/zeitgeber';
import { ResourceFactory, type Types } from './resources';
import { BuildingFactory, type BuildingIdentifier } from './buildings';
import { StockJSON } from 'engine/src/lib/resources/Stock';

@injectable
export class EngineService {
  #zeit = inject(Zeitgeber);
  #resource = inject(ResourceFactory);
  #building = inject(BuildingFactory);

  createEmpire(
    id: ID,
    entities: Phlame<Types, BuildingIdentifier>[] = [],
  ): Empire<Types, BuildingIdentifier> {
    return new Empire(id, entities);
  }

  createPhlame(
    id: ID,
    stock: StockJSON<Types>,
    // TODO actions
    buildings: BuildingJSON<BuildingIdentifier>[] = [],
  ): Phlame<Types, BuildingIdentifier> {
    const { time, tick } = this.#zeit();
    return new Phlame(
      id,
      this.createEconomy({
        name: `${id}`,
        stock,
        buildings,
      }),
      [],
      { time, tick },
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
