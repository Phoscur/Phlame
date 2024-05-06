import { inject, injectable } from '@joist/di';
import {
  ComparableResource,
  Economy,
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

  createPhlame(id: ID): Phlame<Types, BuildingIdentifier> {
    return new Phlame(id, this.createEconomy([]));
  }
  createEconomy(resources: ResourceJSON<Types>[]): Economy<Types, BuildingIdentifier> {
    return new Economy('Eco', this.createStock(resources));
  }
  createStock(json: ResourceJSON<Types>[]): Stock<Types> {
    return new Stock(this.createResources(json));
  }
  createResources(json: ResourceJSON<Types>[]): ResourceCollection<Types> {
    return ResourceCollection.fromArray(json.map((j) => this.createResource(j)));
  }
  createResource(json: ResourceJSON<Types>): ComparableResource<Types> {
    const factory = this.#resource();
    return factory.fromJSON(json);
  }
}
