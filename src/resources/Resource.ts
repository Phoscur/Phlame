export type ResourceIdentifier = string; // i wish^^ = symbol;
export interface ResourceValue<Type extends ResourceIdentifier> {
  readonly type: Type;
  readonly amount: number; // int32
}
// TODO Why are ResourceValue and ComparableResource interface split anyways?
// TODO Remove code duplicaton in Energy.ts -> Refactor extract AbstractResource class
export interface ComparableResource<Type extends ResourceIdentifier> {
  readonly type: Type;
  equalOfTypeTo(resource: ResourceValue<Type>): boolean;
  // TODO amount is missing - this is typecast patched in a weird way, just reunite Energy into Resource?
  equals(resource: ResourceValue<Type>): boolean;
  isMoreOrEquals(resource: ResourceValue<Type>): boolean;
  isLessOrEquals(resource: ResourceValue<Type>): boolean;
  add(resource: ResourceValue<Type>): ComparableResource<Type>;
  subtract(resource: ResourceValue<Type>): ComparableResource<Type>;
  times(factor: number): ComparableResource<Type>;
}

export enum BaseResources {
  Null = "null", // no plural
  Energy = "energy", // no plural, very special
}

export default class Resource<Type extends ResourceIdentifier>
implements ResourceValue<Type>, ComparableResource<Type> {
  static types: ResourceIdentifier[] = [BaseResources.Null]; // Types are appended in configuration

  static Null = new Resource(BaseResources.Null, 0);

  readonly type: Type;

  readonly amount: number; // int32 or infinite

  constructor(type: Type, amount: number) {
    // Instead of throwing an error, set resource amount to zero on underflow
    // TODO handle overflow? use BigIntegers?
    this.amount = amount < 0 ? 0 : amount | 0; // int32|0 handling is very fast in v8
    // Default to null type (!~ = not found)
    this.type = !~Resource.types.indexOf(type) ? Resource.types[0] as Type : type;
  }

  get prettyAmount(): string {
    return `${this.amount}${this.type}`;
  }

  /**
   * Create another resource of the same type
   */
  protected new(amount: number) {
    // Anecdote:
    // Doesn't sound like the best idea considering debugging performance -
    // would be a nice way to not explicitly redeclare this method in every subclass
    /* This makes the new object use the old one as prototype (stores old states in the prototype chain)
    const resource = Object.create(this);
    Resource.call(resource, this.type, amount);
    return resource;
    */
    return new Resource(this.type, amount);
  }

  /* eslint-disable-next-line class-methods-use-this */
  get isEnergy() {
    // Energy implements this with a lookup by type
    return false;
  }

  get zero(): Resource<Type> {
    return this.new(0);
  }

  get infinite(): Resource<Type> {
    // copy, and bypass in32|0 parsing (would be Infinity|0 = 0)
    const inf = Object.create(this);
    inf.type = this.type;
    inf.amount = Number.POSITIVE_INFINITY;
    // TODO we only need this once per type, cache?
    return inf;
  }

  protected checkInfinity(resource?: Resource<Type>): Resource<Type> | false {
    // Need to check for Infinity explicitly, as it's cheated around the constructor
    // which would cast it to in32, result: 0
    if (this.amount === Number.POSITIVE_INFINITY) {
      return this;
    }
    if (resource && resource?.amount === Number.POSITIVE_INFINITY) {
      return resource;
    }
    return false;
  }

  equalOfTypeTo(resource: ResourceValue<Type>) {
    return resource.type === this.type;
  }

  equals(resource: Resource<Type>): boolean {
    return this.equalOfTypeTo(resource)
      // Usually we would need an epsilon to do a float comparison, but since we casted to int32, this works
      && resource.amount === this.amount;
  }

  isMoreOrEquals(resource: Resource<Type>): boolean {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${resource.type})`);
    }
    return this.amount >= resource.amount;
  }

  isLessOrEquals(resource: Resource<Type>): boolean {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${resource.type})`);
    }
    return this.amount <= resource.amount;
  }

  add(resource: Resource<Type>): Resource<Type> {
    if (!this.equalOfTypeTo(resource)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${resource.type})`);
    }
    return this.checkInfinity(resource) || this.new(this.amount + resource.amount);
  }

  addAmount(amount: number) {
    return this.checkInfinity() || this.new(this.amount + amount);
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param subtrahend
   */
  subtract(subtrahend: Resource<Type>): Resource<Type> {
    if (!this.equalOfTypeTo(subtrahend)) {
      throw new TypeError(`Resource types don't match (${this.type} != ${subtrahend.type})`);
    }
    return this.checkInfinity(subtrahend) || this.new(this.amount - subtrahend.amount);
  }

  times(factor: number): Resource<Type> {
    return this.checkInfinity() || this.new(this.amount * factor);
  }

  toString() {
    return `Resource[${this.prettyAmount}]`;
  }
}
