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

  static newUnlimited(limit: Resource, rate: number) {
    return new ResourceProcess(limit, rate);
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
