import Resource, { ResourceIdentifier } from "./Resource";
import ResourceProcess from "./ResourceProcess";

export type ConsumerType = string | number; // I'd prefer string, but if we want integer unitIDs...

export default class Consumer {
  readonly type: ConsumerType;

  readonly level: number;

  readonly speed: number;

  constructor(type: ConsumerType, level?: number, speed?: number) {
    this.type = type;
    this.level = level || 0;
    const defaultSpeed = (!speed || speed >= 1) ? 1 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(level?: number, speed?: number) {
    return new Consumer(this.type, level, speed);
  }

  get upgraded() {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded() {
    return this.new(this.level - 1, this.speed);
  }

  consumes(limit: Resource<ResourceIdentifier>) {
    const rate = this.speed ;
    return new ResourceProcess(limit, rate);
  }

  at(speed: number) {
    return this.new(this.level, speed);
  }

  toString() {
    return `Consumer(${this.type}, ${this.level}, ${this.speed})`;
  }
}
