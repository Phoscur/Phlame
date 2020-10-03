import {
  ResourceIdentifier, Prosumer, ResourceProcessCollection, ResourceProcess, Stock,
} from "./resources";
import BuildingRequirement from "./BuildingRequirement";

export type BuildingType = string | number; // I'd prefer string, but if we want integer unitIDs...

export type LevelToProsumptionFunc = (level: number) => number;

export type ProsumptionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: LevelToProsumptionFunc;
}

export type ProsumptionLookup<Types extends BuildingType> = {
  [Type in Types]?: ProsumptionEntries<ResourceIdentifier>;
}

export default class Building<ResourceType extends ResourceIdentifier> {
  readonly type: BuildingType;

  // Might be nicer to encapsulate configuration in a different way?
  readonly requirements: BuildingRequirement<ResourceType>[];

  // Wrapping Prosumption lookup currently remains in Building
  readonly prosumption: ProsumptionLookup<BuildingType>;

  readonly level: number;

  readonly speed: number;

  constructor(
    type: BuildingType,
    requirements: BuildingRequirement<ResourceType>[],
    prosumption: ProsumptionLookup<BuildingType>,
    level?: number,
    speed = 100,
  ) {
    this.type = type;
    this.requirements = requirements;
    this.prosumption = prosumption;
    this.level = level || 0;
    const defaultSpeed = speed >= 100 ? 100 : speed;
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

  prosumes(stock: Stock<ResourceType>): Prosumer<ResourceType> {
    const prosumption = this.prosumption[this.type] || {};
    const processes = Object.keys(prosumption).map((type) => {
      const prosumptionFunc = prosumption[type];
      const rate = prosumptionFunc ? prosumptionFunc(this.level) : 0;
      // TODO use limits for production (stock.max) and consumption
      const limit = stock.has(type as ResourceType);
      return new ResourceProcess(limit, rate);
    });

    return new Prosumer(this.type, ResourceProcessCollection.fromArray(processes), this.speed);
  }

  toString() {
    return `Building(${this.type}, ${this.level}, ${this.speed}%)`;
  }
}
