import { ComparableResource, ResourceIdentifier } from "./Resource";
import ResourceProcess from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";

export type ProsumerIdentifier = string | number; // I prefer string, if we want numbers for efficiency reasons it should also work

/**
 * Prosumer is a
 * Consumer most of the time,
 * sometimes the opposite: Producer
 * or even both
 * It has a speed applied to the rate of underlying ResourceProcesses
 */
export default class Prosumer<Types extends ResourceIdentifier> {
  readonly type: ProsumerIdentifier;

  readonly processes: ResourceProcessCollection<Types>;

  /**
   * Prosumer speed 0-100 percent
   */
  readonly speed: number;

  constructor(type: ProsumerIdentifier, processes: ResourceProcessCollection<Types>, speed = 100) {
    this.type = type;
    this.processes = processes;
    const defaultSpeed = speed >= 100 ? 100 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(speed?: number): Prosumer<Types> {
    return new Prosumer(this.type, this.processes, speed);
  }

  at(speed: number): Prosumer<Types> {
    return this.new(speed);
  }

  consumes(limit: ComparableResource<Types>): ResourceProcess<Types> | undefined {
    const process = this.processes.getByType(limit.type);
    if (!process || process.rate >= 0) {
      return undefined;
    }
    const rate = (this.speed * process.rate) / 100;
    return new ResourceProcess(limit, rate);
  }

  produces(limit: ComparableResource<Types>): ResourceProcess<Types> | undefined {
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

  toString(): string {
    return `Prosumer(${this.type}, ${this.speed}%, ${this.prosumes})`;
  }
}
