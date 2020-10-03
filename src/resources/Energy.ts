
import {
  ResourceIdentifier,
  BaseResources,
  ResourceValue,
  ComparableResource,
} from "./Resource";

const MAX_VALUE = Number.POSITIVE_INFINITY;

export default class Energy<Type extends ResourceIdentifier = BaseResources.Energy>
implements ResourceValue<Type>, ComparableResource<Type> {
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
  protected new(amount: number) {
    return new Energy(this.type, amount);
  }

  get isEnergy() {
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

  equalOfTypeTo(energy: ResourceValue<Type>) {
    return energy.type === this.type;
  }

  equals(energy: Energy<Type>): boolean {
    return this.equalOfTypeTo(energy)
      // Usually we would need an epsilon to do a float comparison, but since we casted to int32, this works
      && energy.amount === this.amount;
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


  add(resource: Energy<Type>) {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${resource.type})`);
    }
    return this.new(this.amount + resource.amount);
  }

  /**
   * Substract another energy amount
   * Available energy may be negative in contrast to resources
   * @param subtrahend
   */
  subtract(subtrahend: Energy<Type>) {
    if (!this.equalOfTypeTo(subtrahend)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${subtrahend.type})`);
    }
    return this.new(this.amount - subtrahend.amount);
  }

  times(factor: number): Energy<Type> {
    return this.new(this.amount * factor);
  }

  toString() {
    return `Energy[${this.prettyAmount}]`;
  }
}
