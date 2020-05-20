import Resource, { ResourceIdentifier } from "./Resource";
import ResourceCollection from "./ResourceCollection";

export default class Stock<Types extends ResourceIdentifier> {
  readonly resources: ResourceCollection<Types>;

  readonly min: ResourceCollection<Types>;

  readonly max: ResourceCollection<Types>;

  constructor(
    initial: ResourceCollection<Types>,
    minCapacity?: ResourceCollection<Types>,
    maxCapacity?: ResourceCollection<Types>,
  ) {
    this.resources = initial;
    this.min = minCapacity || initial.zero;
    this.max = maxCapacity || initial.infinite;
  }

  protected new(initial: ResourceCollection<Types>) {
    return new Stock(initial, this.min, this.max);
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

  toString() {
    const limitedAmounts = this.resources.asArray.map((resource) => {
      const min = this.min.getByType(resource.type) || resource.zero;
      const max = this.max.getByType(resource.type) || resource.infinite;
      return `${resource.prettyAmount}(${min.amount}, ${max.amount})`;
    }).join(", ");
    return `Stock[${limitedAmounts}]`;
  }
}
