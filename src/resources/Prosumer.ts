import Resource, { ResourceIdentifier } from "./Resource";
import ResourceCollection from "./ResourceCollection";
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

  readonly speed: number;

  constructor(type: ProsumerType, processes: ResourceProcessCollection<Types>, speed?: number) {
    this.type = type;
    this.processes = processes;
    const defaultSpeed = (!speed || speed >= 1) ? 1 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(speed?: number) {
    return new Prosumer(this.type, this.processes, speed);
  }

  consumes(limit: Resource<Types>) {
    const rate = this.speed;
    return new ResourceProcess(limit, rate);
  }

  produces(limit: Resource<Types>) {
    const rate = this.speed;
    return new ResourceProcess(limit, rate);
  }

  prosumes(limits: ResourceCollection<Types>) {
    return ResourceProcessCollection.fromArray(limits.map((limit) => {
      return new ResourceProcess(limit, this.speed); // TODO speed != rate
    }));
  }

  at(speed: number) {
    return this.new(speed);
  }

  toString() {
    return `Prosumer(${this.type}, ${this.speed})`;
  }
}
