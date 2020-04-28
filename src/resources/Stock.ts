import ResourceCollection, { Resources } from "./ResourceCollection";

export default class Stock {
  readonly resources: ResourceCollection;

  readonly min: ResourceCollection;

  readonly max: ResourceCollection;

  constructor(initial: ResourceCollection, minCapacity?: ResourceCollection, maxCapacity?: ResourceCollection) {
    this.resources = initial;
    this.min = minCapacity || initial.zero;
    this.max = maxCapacity || initial.infinite;
  }

  protected new(initial: ResourceCollection) {
    return new Stock(initial, this.min, this.max);
  }

  isInLimits(resources?: Resources) {
    return !resources
      ? this.resources.isMoreOrEquals(this.min) && this.resources.isLessOrEquals(this.max)
      : this.resources.subtract(resources).isMoreOrEquals(this.min)
        && this.resources.add(resources).isLessOrEquals(this.max);
  }

  store(resources: Resources) {
    return this.new(this.resources.add(resources));
  }

  fetch(resources: Resources) {
    return this.new(this.resources.subtract(resources));
  }

  toString() {
    const limitedAmounts = this.resources.asArray.map((resource) => {
      const min = this.min.entries[resource.type].amount;
      const max = this.max.entries[resource.type].amount;
      return `${resource.prettyAmount}(${min}, ${max})`;
    }).join(", ");
    return `Stock[${limitedAmounts}]`;
  }
}
