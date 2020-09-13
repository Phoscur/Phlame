
import { ResourceIdentifier, ResourceValue, BaseResources } from "./Resource";

export default class Energy<Type extends ResourceIdentifier = BaseResources.Energy> implements ResourceValue {
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

  equalOfTypeTo(energy: Energy<Type>) {
    return energy.type === this.type;
  }

  equals(energy: Energy<Type>) {
    return this.equalOfTypeTo(energy)
      // Usually we would need an epsilon to do a float comparison, but since we casted to int32, this works
      && energy.amount === this.amount;
  }

  isMoreOrEquals(energy: Energy<Type>) {
    if (!this.equalOfTypeTo(energy)) {
      throw new TypeError(`Energy types don't match (${this.type} != ${energy.type})`);
    }
    return this.amount >= energy.amount;
  }

  isLessOrEquals(energy: Energy<Type>) {
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

  toString() {
    return `Energy[${this.prettyAmount}]`;
  }
}
