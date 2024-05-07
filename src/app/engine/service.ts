import { inject, injectable } from '@joist/di';
import {
  ComparableResource,
  Economy,
  Empire,
  ID,
  Phlame,
  ResourceCollection,
  ResourceJSON,
  Stock,
} from '@phlame/engine';
import { Zeitgeber } from '../signals/zeitgeber';
import { ResourceFactory, type Types } from './resources';
import type { BuildingIdentifier } from './buildings';

@injectable
export class EngineService {
  #zeit = inject(Zeitgeber);
  #resource = inject(ResourceFactory);

  createEmpire(
    id: ID,
    entities: Phlame<Types, BuildingIdentifier>[] = [],
  ): Empire<Types, BuildingIdentifier> {
    return new Empire(id, entities);
  }
  createPhlame(id: ID, resources: ResourceJSON<Types>[] = []): Phlame<Types, BuildingIdentifier> {
    const { time, tick } = this.#zeit();
    return new Phlame(id, this.createEconomy(resources), [], { time, tick });
  }
  createEconomy(resources: ResourceJSON<Types>[]): Economy<Types, BuildingIdentifier> {
    return new Economy('Eco', this.createStock(resources));
  }
  createStock(json: ResourceJSON<Types>[], maximum?: ResourceJSON<Types>[]): Stock<Types> {
    return new Stock(this.createResources(json), maximum && this.createResources(maximum));
  }
  createResources(json: ResourceJSON<Types>[]): ResourceCollection<Types> {
    return ResourceCollection.fromArray(json.map((j) => this.createResource(j)));
  }
  createResource(json: ResourceJSON<Types>): ComparableResource<Types> {
    const factory = this.#resource();
    return factory.fromJSON(json);
  }
}
