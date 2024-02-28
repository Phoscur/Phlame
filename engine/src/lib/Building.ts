import {
  ResourceIdentifier,
  Resource,
  ResourceProcess,
  ResourceProcessCollection,
  Prosumer,
  Stock,
  ResourceCollection,
} from "./resources";
import BuildingRequirement from "./BuildingRequirement";
import type { TimeUnit } from "./resources/ResourceProcess";
import type { ProsumerIdentifier } from "./resources/Prosumer";

export type BuildingIdentifier = ProsumerIdentifier;

export type LevelToProsumptionFunc = (level: number) => number;

export type ProsumptionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: LevelToProsumptionFunc;
};

export type ProsumptionLookup<
  Types extends BuildingIdentifier,
  ResourceTypes extends ResourceIdentifier
> = {
  [Type in Types]?: ProsumptionEntries<ResourceTypes>;
};

export type RequirementLookup<
  Types extends BuildingIdentifier,
  ResourceTypes extends ResourceIdentifier
> = {
  [Type in Types]?: BuildingRequirement<Types, ResourceTypes>;
};

export default class Building<
  BuildingType extends BuildingIdentifier,
  ResourceType extends ResourceIdentifier
> {
  static BUILD_TIME_DIVISOR = 2500 / 60;
  readonly type: BuildingType;

  // For now we have the full lookup here, might be nicer to encapsulate in a different way?
  readonly requirements: RequirementLookup<BuildingType, ResourceType>;
  readonly prosumption: ProsumptionLookup<BuildingType, ResourceType>;

  readonly level: number;

  readonly speed: number;

  constructor(
    type: BuildingType,
    requirements: RequirementLookup<BuildingType, ResourceType>,
    prosumption: ProsumptionLookup<BuildingType, ResourceType>,
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

  protected new(level?: number, speed?: number): Building<BuildingType, ResourceType> {
    return new Building(this.type, this.requirements, this.prosumption, level, speed);
  }

  get upgradeCost(): ResourceCollection<ResourceType> {
    const requirement = this.requirements[this.type];
    if (!requirement) {
      throw new Error(`Unknown building requirement, BuildingType: ${this.type}`);
    }
    return requirement.getUpgradeCost(this.level + 1);
  }

  get downgradeCost(): ResourceCollection<ResourceType> {
    const requirement = this.requirements[this.type];
    if (!requirement) {
      throw new Error(`Unknown building requirement, BuildingType: ${this.type}`);
    }
    return requirement.getDowngradeCost(this.level + 1);
  }

  get upgradeTime(): TimeUnit {
    return Math.floor(
      this.upgradeCost.map((resource) => resource.amount).reduce((sum, amount) => sum + amount, 0) /
        Building.BUILD_TIME_DIVISOR,
    );
  }

  get downgradeTime(): TimeUnit {
    return Math.floor(
      this.downgradeCost
        .map((resource) => resource.amount)
        .reduce((sum, amount) => sum + amount, 0) / Building.BUILD_TIME_DIVISOR,
    );
  }

  get upgraded(): Building<BuildingType, ResourceType> {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded(): Building<BuildingType, ResourceType> {
    return this.new(this.level - 1, this.speed);
  }

  at(speed: number): Building<BuildingType, ResourceType> {
    return this.new(this.level, speed);
  }

  get disabled(): Building<BuildingType, ResourceType> {
    return this.at(0);
  }

  prosumes(stock: Stock<ResourceType>): Prosumer<ResourceType> {
    // TODO maybe we really don't need the lookups here, or can this work without the typecasts?
    const prosumption = (this.prosumption[this.type] || {}) as ProsumptionEntries<ResourceType>;
    const processes = Object.keys(prosumption).map((type) => {
      const prosumptionFunc = prosumption[type as ResourceType] as LevelToProsumptionFunc; // never undefined
      const rate = prosumptionFunc(this.level);
      const stocked = stock.has(type as ResourceType);
      // limit production for an optionally maximal stock
      // also for energy a zero resource resource can be created implicitly
      const max = (stock.max.getByType(type as ResourceType) as Resource<ResourceType>) || stocked;
      return new ResourceProcess<ResourceType>(rate > 0 ? max : stocked, rate);
    });

    return new Prosumer<ResourceType>(
      this.type,
      ResourceProcessCollection.fromArray<ResourceType>(processes),
      this.speed,
    );
  }

  toString(): string {
    return `Building(${this.type}, ${this.level}, ${this.speed}%)`;
  }
}
