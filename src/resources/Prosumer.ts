import { process } from "./examples";
import Energy from "./Energy";
import Resource, { ResourceIdentifier } from "./Resource";
import ResourceProcess from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";

export type ProsumerType = string | number; // I'd prefer string, but if we want integer unitIDs...

/**
 * Prosumer is a
 * Consumer most of the time,
 * sometimes the opposite: Producer
 * or even both
 */
export default class Prosumer<Types extends ResourceIdentifier> {
  readonly type: ProsumerType;

  readonly processes: ResourceProcessCollection<Types>;

  /**
   * Prosumer speed 0-100 percent
   */
  readonly speed: number;

  constructor(type: ProsumerType, processes: ResourceProcessCollection<Types>, speed = 100) {
    this.type = type;
    this.processes = processes;
    const defaultSpeed = speed >= 100 ? 100 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(speed?: number) {
    return new Prosumer(this.type, this.processes, speed);
  }

  at(speed: number) {
    return this.new(speed);
  }

  consumes(limit: Resource<Types> | Energy<Types>) {
    const process = this.processes.getByType(limit.type);
    if (!process || process.rate >= 0) {
      return undefined;
    }
    const rate = (this.speed * process.rate) / 100;
    return new ResourceProcess(limit, rate);
  }

  produces(limit: Resource<Types> | Energy<Types>) {
    const process = this.processes.getByType(limit.type);
    if (!process || process.rate <= 0) {
      return undefined;
    }
    const rate = (this.speed * process.rate) / 100;
    return new ResourceProcess(limit, rate);
  }

  get prosumes(): ResourceProcessCollection<Types> {
    return this.processes.newRateMultiplier(this.speed / 100);
  }

  get resources(): ResourceProcessCollection<Types> {
    return this.processes.resources.newRateMultiplier(this.speed / 100);
  }

  toString() {
    return `Prosumer(${this.type}, ${this.speed}%, ${this.prosumes})`;
  }
}
