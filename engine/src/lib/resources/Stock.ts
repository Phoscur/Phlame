import { ComparableResource, type ResourceIdentifier, type ResourceJSON } from './Resource';
import { ResourceCollection, type ResourcesLike } from './ResourceCollection';

export type StockJSON<Types extends ResourceIdentifier> = {
  resources: ResourceJSON<Types>[];
  max?: ResourceJSON<Types>[];
  min?: ResourceJSON<Types>[];
};
export class Stock<Types extends ResourceIdentifier> {
  constructor(
    readonly resources: ResourceCollection<Types>,
    readonly max: ResourceCollection<Types> = resources.infinite,
    readonly min: ResourceCollection<Types> = resources.zero,
  ) {}

  getByType<Type extends Types>(type: Type): ComparableResource<Types> | undefined {
    return this.resources.getByType(type);
  }

  has<Type extends Types>(type: Type): ComparableResource<Types> {
    return this.resources.get(type);
  }

  /**
   * Resources which may still fit into until the upper bound it reached
   * @param resource
   */
  getMaxResource(resource: ComparableResource<Types>): ComparableResource<Types> {
    const stocked = this.getByType(resource.type);
    const max = this.max.getByType(resource.type) || resource.infinite;
    return stocked ? max.subtract(stocked) : max;
  }

  /**
   * Resources which may still be consumed until lower bound it reached
   * @param resource
   */
  getMinResource(resource: ComparableResource<Types>): ComparableResource<Types> {
    const stocked = this.getByType(resource.type);
    const min = this.min.getByType(resource.type) || resource.zero;
    return stocked ? stocked.subtract(min) : min;
  }

  protected new(initial: ResourceCollection<Types>): Stock<Types> {
    return new Stock(initial, this.max, this.min);
  }

  isInLimits(resources?: ResourcesLike<Types>): boolean {
    return !resources
      ? this.resources.isMoreOrEquals(this.min) && this.resources.isLessOrEquals(this.max)
      : this.resources.subtract(resources).isMoreOrEquals(this.min) && this.isStorable(resources);
  }

  isFetchable(resources: ResourcesLike<Types>): boolean {
    return this.resources.isMoreOrEquals(resources);
  }

  protected isResourceCollection(
    resources: ResourcesLike<Types>,
  ): resources is ResourceCollection<Types> {
    return resources.type === ResourceCollection.TYPE;
  }

  protected isResource(resource: ResourcesLike<Types>): resource is ResourceCollection<Types> {
    return !this.isResourceCollection(resource) && !resource.isEnergy;
  }

  getUnfetchable(resources: ResourceCollection<Types>): ResourceCollection<Types> {
    return ResourceCollection.fromArray<Types>(
      resources.map((resource) => {
        if (!this.isResource(resource)) {
          return undefined;
        }
        if (this.isFetchable(resource)) {
          return undefined;
        }
        return resource;
      }),
    );
  }

  isStorable(resources: ResourcesLike<Types>): boolean {
    return this.resources.add(resources).isLessOrEquals(this.max);
  }

  store(resources: ResourcesLike<Types>): Stock<Types> {
    return this.new(this.resources.add(resources));
  }

  fetch(resources: ResourcesLike<Types>): Stock<Types> {
    return this.new(this.resources.subtract(resources));
  }

  // TODO upgrade(new limits)

  resourceLimitToString(resource: ComparableResource<Types>): string {
    const [min, max] = this.getResourceLimits(resource);
    return `${resource.prettyAmount}(${min}, ${max})`;
  }

  getResourceLimits(resource: ComparableResource<Types>): [number, number] {
    const min = this.min.getByType(resource.type) || resource.zero;
    const max = this.max.getByType(resource.type) || resource.infinite;
    return [min.amount, max.amount];
  }

  get limitedAmounts(): string[] {
    return this.resources.asArray.map((resource) => {
      return this.resourceLimitToString(resource);
    });
  }

  toString(): string {
    return `Stock[${this.limitedAmounts.join(', ')}]`;
  }

  toJSON(): StockJSON<Types> {
    return {
      resources: this.resources.toJSON(),
      ...(this.max.equals(this.max.infinite) ? {} : { max: this.max.toJSON() }),
      ...(this.min.equals(this.min.zero) ? {} : { min: this.min.toJSON() }),
    };
  }
}
