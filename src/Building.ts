import {
  ResourceIdentifier, Prosumer, ResourceProcessCollection, ResourceProcess, ResourceCollection,
} from "./resources";
import BuildingRequirement from "./BuildingRequirement";

export type BuildingType = string | number; // I'd prefer string, but if we want integer unitIDs...

export type levelToProsumptionFunc = (level: number) => number;

export type ProsumptionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: levelToProsumptionFunc;
}

export type ProsumptionLookup<Types extends BuildingType> = {
  [Type in Types]?: ProsumptionEntries<ResourceIdentifier>;
}

export default class Building {
  readonly type: BuildingType;

  // Might be nicer to encapsulate configuration in a different way?
  readonly requirements: BuildingRequirement<ResourceIdentifier>[];

  // Wrapping Prosumption lookup currently remains in Building
  readonly prosumption: ProsumptionLookup<BuildingType>;

  readonly level: number;

  readonly speed: number;

  constructor(
    type: BuildingType,
    requirements: BuildingRequirement<ResourceIdentifier>[],
    prosumption: ProsumptionLookup<BuildingType>,
    level?: number,
    speed?: number,
  ) {
    this.type = type;
    this.requirements = requirements;
    this.prosumption = prosumption;
    this.level = level || 0;
    const defaultSpeed = (!speed || speed >= 1) ? 1 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(level?: number, speed?: number) {
    return new Building(this.type, this.requirements, this.prosumption, level, speed);
  }

  get upgraded() {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded() {
    return this.new(this.level - 1, this.speed);
  }

  at(speed: number) {
    return this.new(this.level, speed);
  }

  prosumes(limits: ResourceCollection<ResourceIdentifier>): Prosumer<ResourceIdentifier> {
    const prosumption = this.prosumption[this.type];
    const processes = limits.map((limit, resourceType) => {
      if (!prosumption || !prosumption[resourceType]) {
        return new ResourceProcess(limit, 0);
      }
      // undefined is guarded, don't know why typescript won't recognise it - typecasting as an override
      const rate = (prosumption[resourceType] as levelToProsumptionFunc)(this.level);
      return new ResourceProcess(limit, rate);
    });

    return new Prosumer(this.type, ResourceProcessCollection.fromArray(processes), this.speed);
  }

  toString() {
    return `Building(${this.type}, ${this.level}, ${this.speed})`;
  }
}
