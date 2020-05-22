import Resource, { ResourceIdentifier } from "./Resource";
import ResourceCollection from "./ResourceCollection";

export default class Stock<Types extends ResourceIdentifier> {
  readonly resources: ResourceCollection<Types>;

  readonly min: ResourceCollection<Types>;

  readonly max: ResourceCollection<Types>;

  constructor(
    initial: ResourceCollection<Types>,
    maxCapacity?: ResourceCollection<Types>,
    minCapacity?: ResourceCollection<Types>,
  ) {
    this.resources = initial;
    this.max = maxCapacity || initial.infinite;
    this.min = minCapacity || initial.zero;
  }

  getByType<Type extends Types>(type: Type): Resource<Types>|undefined {
    return this.resources.getByType(type);
  }

  getResource(resource: Resource<Types>): Resource<Types> {
    return this.resources.getByType(resource.type) || resource.zero;
  }

  /**
   * Resources which may still fit into until the upper bound it reached
   * @param resource
   */
  getMaxResource(resource: Resource<Types>): Resource<Types> {
    const stocked = this.getByType(resource.type);
    const max = this.max.getByType(resource.type) || resource.infinite;
    return stocked ? max.subtract(stocked) : max;
  }

  /**
   * Resources which may still be consumed until lower bound it reached
   * @param resource
   */
  getMinResource(resource: Resource<Types>): Resource<Types> {
    const stocked = this.getByType(resource.type);
    const min = this.min.getByType(resource.type) || resource.zero;
    return stocked ? stocked.subtract(min) : min;
  }

  protected new(initial: ResourceCollection<Types>) {
    return new Stock(initial, this.max, this.min);
  }

  isInLimits(resources?: Resource<Types> | ResourceCollection<Types>) {
    return !resources
      ? this.resources.isMoreOrEquals(this.min) && this.resources.isLessOrEquals(this.max)
      : this.resources.subtract(resources).isMoreOrEquals(this.min)
      && this.resources.add(resources).isLessOrEquals(this.max);
  }

  store(resources: Resource<Types> | ResourceCollection<Types>) {
    return this.new(this.resources.add(resources));
  }

  fetch(resources: Resource<Types> | ResourceCollection<Types>) {
    return this.new(this.resources.subtract(resources));
  }

  resourceLimitToString(resource: Resource<Types>) {
    const min = this.min.getByType(resource.type) || resource.zero;
    const max = this.max.getByType(resource.type) || resource.infinite;
    return `${resource.prettyAmount}(${min.amount}, ${max.amount})`;
  }

  limitedAmountsToString(): string[] {
    return this.resources.asArray.map((resource) => {
      return this.resourceLimitToString(resource);
    });
  }

  toString() {
    return `Stock[${this.limitedAmountsToString().join(", ")}]`;
  }
}
