import Resource, { ComparableResource, ResourceIdentifier } from "./Resource";
import Energy from "./Energy";

export type TimeUnit = number;

export default class ResourceProcess<Type extends ResourceIdentifier> {
  readonly limit: ComparableResource<Type>;

  readonly rate: number;

  constructor(limit: ComparableResource<Type>, rate: number) {
    this.limit = limit;
    // we can't have floats, it would be wrong in situations (e.g. skipped through game ticks can produce more than single ticks respectively - 0.7 rate over two ticks is 2 rather than 0)
    this.rate = Math.round(rate); // nicer than a ceiling int32 cast here?
  }

  get type(): Type {
    return this.limit.type;
  }

  get negative(): ResourceProcess<Type> {
    return new ResourceProcess(this.limit, -this.rate);
  }

  get isNegative(): boolean {
    return this.rate < 0;
  }

  get isZero(): boolean {
    return this.rate === 0;
  }

  get endsIn(): TimeUnit {
    if (this.isZero) {
      return Number.POSITIVE_INFINITY;
    }
    const endsIn = this.limit.amount / Math.abs(this.rate);
    return Number.isFinite(endsIn) ? endsIn | 0 : endsIn;
  }

  newLimit(limit: ComparableResource<Type>): ResourceProcess<Type> {
    return new ResourceProcess(limit, this.rate);
  }

  limitFromRate(): ResourceProcess<Type> {
    const limit = this.limit.addAmount(this.rate);
    return this.newLimit(limit);
  }

  addLimit(resource: ComparableResource<Type>): ResourceProcess<Type> {
    return this.newLimit(this.limit.add(resource));
  }

  newRate(rate: number): ResourceProcess<Type> {
    return new ResourceProcess(this.limit, rate);
  }

  /**
   * Add rates and keep upper limits
   * @param resourceProcess
   */
  add(resourceProcess: ResourceProcess<Type>): ResourceProcess<Type> {
    if (!this.equalOfTypeTo(resourceProcess)) {
      throw new TypeError(`ResourceProcess types don't match (${this.type} != ${resourceProcess.type})`);
    }
    // both Resource and Energy are typeguarded ComparableResources TODO fix remove typecast
    const oldLimit = resourceProcess.limit as Resource<Type> & Energy<Type>;
    const rate = this.rate + resourceProcess.rate;
    const addedLimits = this.limit.add(oldLimit);
    const limit =
      rate > 0
        ? // upper limit for positive rate, keeps infinity
          this.limit.isMoreOrEquals(oldLimit)
          ? this.limit
          : resourceProcess.limit
        : // lowest limit for negative rate, overwrites infinity
        !this.limit.isInfinite && !resourceProcess.limit.isInfinite
        ? addedLimits // add, else take non infinite
        : (!oldLimit.isInfinite && oldLimit) || this.limit;
    return new ResourceProcess(limit, rate);
  }

  /**
   * Subtract rates and keep the limit
   * @param resourceProcess
   */
  subtract(resourceProcess: ResourceProcess<Type>): ResourceProcess<Type> {
    if (!this.equalOfTypeTo(resourceProcess)) {
      throw new TypeError(`ResourceProcess types don't match (${this.type} != ${resourceProcess.type})`);
    }
    return this.newRate(this.rate - resourceProcess.rate);
  }

  getResourceFor(timeUnits: TimeUnit = 1): Resource<Type> | Energy<Type> {
    if (~Energy.types.indexOf(this.limit.type)) {
      return new Energy(this.limit.type, Math.abs(this.rate) * timeUnits);
    }
    return new Resource(this.limit.type, Math.abs(this.rate) * timeUnits);
  }

  /**
   * Get the same resource process after a given time (with limits adjusted)
   * @param timeUnits
   */
  after(timeUnits: TimeUnit): ResourceProcess<Type> {
    const output = this.getResourceFor(timeUnits) as Resource<Type> & Energy<Type>;
    const limit = this.limit.subtract(output);
    return new ResourceProcess(limit, this.rate);
  }

  equalOfTypeTo(process: ResourceProcess<Type>): boolean {
    return process.limit.equalOfTypeTo(this.limit);
  }

  equals(process: ResourceProcess<Type>): boolean {
    // both Resource and Energy are typeguarded ComparableResources
    const limit = process.limit as Resource<Type> & Energy<Type>;
    return this.equalOfTypeTo(process) && this.limit.equals(limit) && process.rate === this.rate;
  }

  toString(): string {
    return `ResourceProcess[${this.limit.type}, ${this.rate}, ${this.limit.amount}]`;
  }
}
