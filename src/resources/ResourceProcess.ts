import Resource from "./Resource";

// Floating point operations are not save!
const ZERO_TOLERANCE = 0.0000001;

export default class ResourceProcess {
  readonly limit: Resource;

  readonly rate: number;

  constructor(limit: Resource, rate: number) {
    this.limit = limit;
    this.rate = rate > ZERO_TOLERANCE ? rate : 0;
  }

  protected new(limit?: Resource, rate?: number) {
    return new ResourceProcess(limit || this.limit, rate || this.rate);
  }

  get type(): string {
    return this.limit.type;
  }

  get negative(): ResourceProcess {
    return this.new(this.limit, -this.rate);
  }

  add(resourceProcess: ResourceProcess) {
    if (!this.equalOfTypeTo(resourceProcess)) {
      throw new TypeError(`ResourceProcess types don't match (${this.type} != ${resourceProcess.type})`);
    }
    return this.new(this.limit.add(resourceProcess.limit), this.rate + resourceProcess.rate);
  }

  subtract(resourceProcess: ResourceProcess) {
    return this.add(resourceProcess.negative);
  }

  equalOfTypeTo(process: ResourceProcess) {
    return process.limit.equalOfTypeTo(this.limit);
  }

  equals(process: ResourceProcess) {
    return this.equalOfTypeTo(process)
      && process.limit === this.limit
      && Math.abs(process.rate - this.rate) < ZERO_TOLERANCE;
  }

  toString() {
    return `ResourceProcess[${this.limit.type}, ${this.rate}, ${this.limit.amount}]`;
  }
}
