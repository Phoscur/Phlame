
export interface ResourceValue {
  readonly type: string;
  readonly amount: number; // int32
}
export default class Resource implements ResourceValue {
  static types = ["null"];

  readonly type: string;

  readonly amount: number; // int32

  constructor(type: string, amount: number) {
    // Instead of throwing an error, set resource amount to zero on underflow
    // TODO handle overflow? use BigIntegers?
    this.amount = amount < 0 ? 0 : amount | 0; // int32|0 handling is very fast in v8
    // Default to null type (!~ = not found)
    this.type = !~Resource.types.indexOf(type) ? Resource.types[0] : type;
  }

  get prettyAmount(): string {
    return `${this.amount}${this.type}`;
  }

  /**
   * Create another resource of the same type
   */
  protected new(amount: number) {
    // Doesn't sound like the best idea considering debugging performance -
    // would be a nice way to not explicitly redeclare this method in every subclass
    /* This makes the new object use the old one as prototype (stores old states in the prototype chain)
    const resource = Object.create(this);
    Resource.call(resource, this.type, amount);
    return resource;
    */
    return new Resource(this.type, amount);
  }

  get zero(): Resource {
    return this.new(0);
  }

  equalOfTypeTo(resource: Resource) {
    return resource.type === this.type;
  }

  equals(resource: Resource) {
    return this.equalOfTypeTo(resource)
      // Usually we would need an epsilon to do a float comparison, but since we casted to int32, this works
      && resource.amount === this.amount;
  }

  isMoreOrEquals(resource: Resource) {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${resource.type})`);
    }
    return this.amount >= resource.amount;
  }

  isLessOrEquals(resource: Resource) {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${resource.type})`);
    }
    return this.amount <= resource.amount;
  }

  add(resource: Resource) {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${resource.type})`);
    }
    return this.new(this.amount + resource.amount);
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param subtrahend
   */
  subtract(subtrahend: Resource) {
    if (!this.equalOfTypeTo(subtrahend)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${subtrahend.type})`);
    }
    return this.new(this.amount - subtrahend.amount);
  }

  times(factor: number) {
    return this.new(this.amount * factor);
  }

  toString() {
    return `Resource[${this.prettyAmount}]`;
  }
}
