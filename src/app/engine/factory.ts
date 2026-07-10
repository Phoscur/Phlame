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
  type PhelopmentJSON,
  type ID,
  type ResourceJSON,
  type PhlameJSON,
  EmpireJSON,
} from '@phlame/engine';
import { ResourceFactory, type ResourceIdentifier } from './resources';
import { PhelopmentFactory, phormulae, type PhelopmentIdentifier } from './phelopments';

export type EmpireEntity = Empire<ResourceIdentifier, PhelopmentIdentifier>;
export type PhlameEntity = Phlame<ResourceIdentifier, PhelopmentIdentifier>;

@injectable()
export class EngineFactory {
  #resource = inject(ResourceFactory);
  #phelopment = inject(PhelopmentFactory);

  createEmpire(
    json: EmpireJSON<ResourceIdentifier, PhelopmentIdentifier>,
  ): Empire<ResourceIdentifier, PhelopmentIdentifier> {
    return new Empire(json.id, this.createEntities(json.entities));
  }

  createEntities(
    es: PhlameJSON<ResourceIdentifier, PhelopmentIdentifier>[],
  ): Phlame<ResourceIdentifier, PhelopmentIdentifier>[] {
    return es.map((p) => this.createPhlame(p.id, p.tick, p.stock, p.phelopments, p.actions));
  }

  createPhlame(
    id: ID,
    tick: number,
    stock: StockJSON<ResourceIdentifier>,
    phelopments: PhelopmentJSON<PhelopmentIdentifier>[] = [],
    actions: PhlameJSON<ResourceIdentifier, PhelopmentIdentifier>['actions'] = [],
  ): Phlame<ResourceIdentifier, PhelopmentIdentifier> {
    const phlame = new Phlame(
      id,
      this.createEconomy({
        name: `${id}`,
        stock,
        phelopments,
      }),
      [],
      tick,
    );
    // rehydrate the circular concerns reference (actions are stored chronologically)
    for (const action of actions) {
      phlame.add({ ...action, concerns: phlame });
    }
    return phlame;
  }

  createEconomy({
    name,
    stock,
    phelopments,
  }: EconomyJSON<ResourceIdentifier, PhelopmentIdentifier>): Economy<
    ResourceIdentifier,
    PhelopmentIdentifier
  > {
    return new Economy(
      name,
      this.createStock(stock),
      phelopments.map((b) => this.createPhelopment(b)),
      phormulae,
    );
  }

  createPhelopment(json: PhelopmentJSON<PhelopmentIdentifier>) {
    const factory = this.#phelopment();
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
