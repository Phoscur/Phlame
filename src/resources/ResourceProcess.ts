import Resource, { ResourceIdentifier } from "./Resource";

// Floating point operations are not save!
const ZERO_TOLERANCE = 0.0000001;

export type TimeUnit = number;

export default class ResourceProcess<Type extends ResourceIdentifier> {
  readonly limit: Resource<Type>;

  readonly rate: number;

  constructor(limit: Resource<Type>, rate: number) {
    this.limit = limit;
    this.rate = Math.abs(rate) > ZERO_TOLERANCE ? rate : 0;
  }

  get type(): Type {
    return this.limit.type;
  }

  get negative(): ResourceProcess<Type> {
    return new ResourceProcess(this.limit, -this.rate);
  }

  get isNegative() {
    return this.rate < 0;
  }

  get isZero() {
    return this.rate === 0;
  }

  get endsIn(): TimeUnit {
    if (this.isZero) {
      return Number.POSITIVE_INFINITY;
    }
    const endsIn = this.limit.amount / Math.abs(this.rate);
    return Number.isFinite(endsIn) ? endsIn | 0 : endsIn;
  }

  newLimit(limit: Resource<Type>) {
    return new ResourceProcess(limit, this.rate);
  }

  newRate(rate: number) {
    return new ResourceProcess(this.limit, rate);
  }

  /**
   * Add rates and keep upper limits
   * @param resourceProcess
   */
  add(resourceProcess: ResourceProcess<Type>) {
    if (!this.equalOfTypeTo(resourceProcess)) {
      throw new TypeError(`ResourceProcess types don't match (${this.type} != ${resourceProcess.type})`);
    }
    const limit = this.limit.isMoreOrEquals(resourceProcess.limit)
      ? this.limit
      : resourceProcess.limit;
    return new ResourceProcess(limit, this.rate + resourceProcess.rate);
  }

  /**
   * Subtract rates and keep the limit
   * @param resourceProcess
   */
  subtract(resourceProcess: ResourceProcess<Type>) {
    if (!this.equalOfTypeTo(resourceProcess)) {
      throw new TypeError(`ResourceProcess types don't match (${this.type} != ${resourceProcess.type})`);
    }
    return this.newRate(this.rate - resourceProcess.rate);
  }

  getResourceFor(timeUnits: TimeUnit = 1): Resource<Type> {
    return new Resource(this.limit.type, Math.abs(this.rate) * timeUnits);
  }

  /**
   * Get the same resource process after a given time (with limits adjusted)
   * @param timeUnits
   */
  after(timeUnits: TimeUnit): ResourceProcess<Type> {
    const limit = this.limit.subtract(this.getResourceFor(timeUnits));
    return new ResourceProcess(limit, this.rate);
  }

  equalOfTypeTo(process: ResourceProcess<Type>) {
    return process.limit.equalOfTypeTo(this.limit);
  }

  equals(process: ResourceProcess<Type>) {
    return this.equalOfTypeTo(process)
      && process.limit.equals(this.limit)
      && Math.abs(process.rate - this.rate) < ZERO_TOLERANCE;
  }

  toString() {
    return `ResourceProcess[${this.limit.type}, ${this.rate}, ${this.limit.amount}]`;
  }
}
