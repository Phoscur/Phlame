import { ResourceIdentifier, BaseResources, ResourceValue, ComparableResource } from "./Resource";

const MAX_VALUE = Number.POSITIVE_INFINITY; // if we want Number.MAX_VALUE here instead we need more checks getting closer to it

// TODO? wouldn't typing be easier/nicer with energy inheriting from Resource? do we even need this file, it duplicates Resource?
// refactor extract AbstractResource
/**
 * Energy
 * like Resource, however substraction allows for negative amounts for edge cases
 * also Limits in ResourceProcesses work differently than for Resource
 */
export default class Energy<Type extends ResourceIdentifier = BaseResources.Energy>
  implements ComparableResource<Type>
{
  static types: ResourceIdentifier[] = [BaseResources.Null];

  static MAX_VALUE = MAX_VALUE;

  readonly type: Type;

  readonly amount: number; // int32

  constructor(type: Type, amount: number) {
    this.amount = amount | 0; // int32|0 handling is very fast in v8 - cutting off the floating part of the number
    this.type = type;
  }

  get prettyAmount(): string {
    return `${this.amount}${this.type}`;
  }

  /**
   * Create another resource of the same type
   */
  protected new(amount: number): Energy<Type> {
    return new Energy(this.type, amount);
  }

  get isEnergy(): boolean {
    return !!~Energy.types.indexOf(this.type);
  }

  get zero(): Energy<Type> {
    return this.new(0);
  }

  get infinite(): Energy<Type> {
    // copy, and bypass int32|0 parsing (would be Infinity|0 = 0)
    const inf = Object.create(this);
    inf.type = this.type;
    inf.amount = Energy.MAX_VALUE;
    return inf;
  }

  get isInfinite(): boolean {
    return this.amount === Number.POSITIVE_INFINITY;
  }

  protected checkInfinity(energy?: Energy<Type>): Energy<Type> | false {
    // Need to check for Infinity explicitly, as it's cheated around the constructor
    // which would cast it to in32, result: 0
    if (this.amount === Energy.MAX_VALUE) {
      return this;
    }
    if (energy && energy?.amount === Energy.MAX_VALUE) {
      return energy;
    }
    return false;
  }

  equalOfTypeTo(energy: ResourceValue<Type>): boolean {
    return energy.type === this.type;
  }

  equals(energy: Energy<Type>): boolean {
    return (
      this.equalOfTypeTo(energy) &&
      // Usually we would need an epsilon to do a float comparison, but since we casted to int32, this works
      energy.amount === this.amount
    );
  }

  isMoreOrEquals(energy: Energy<Type>): boolean {
    if (!this.equalOfTypeTo(energy)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${energy.type})`);
    }
    return this.amount >= energy.amount;
  }

  isLessOrEquals(energy: Energy<Type>): boolean {
    if (!this.equalOfTypeTo(energy)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${energy.type})`);
    }
    return this.amount <= energy.amount;
  }

  add(resource: Energy<Type>): Energy<Type> {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${resource.type})`);
    }
    return this.checkInfinity(resource) || this.new(this.amount + resource.amount);
  }

  addAmount(amount: number): Energy<Type> {
    return this.checkInfinity() || this.new(this.amount + amount);
  }

  /**
   * Substract another energy amount
   * Available energy may be negative in contrast to resources
   */
  subtract(subtrahend: Energy<Type>): Energy<Type> {
    if (!this.equalOfTypeTo(subtrahend)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${subtrahend.type})`);
    }
    return this.new(this.amount - subtrahend.amount);
  }

  times(factor: number): Energy<Type> {
    return this.new(this.amount * factor);
  }

  toString(): string {
    return `Energy[${this.prettyAmount}]`;
  }
}
