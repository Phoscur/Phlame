import {
  ResourceIdentifier,
  Resource,
  ResourceProcess,
  ResourceProcessCollection,
  Prosumer,
  Stock,
  ResourceCollection,
} from './resources';
import { BuildingRequirement } from './BuildingRequirement';
import type { TimeUnit } from './resources/ResourceProcess';
import type { ProsumerIdentifier } from './resources/Prosumer';

export type BuildingIdentifier = ProsumerIdentifier;

export type LevelToProsumptionFunc = (level: number) => number;

export type ProsumptionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: LevelToProsumptionFunc;
};

export type ProsumptionLookup<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> = {
  [Type in BuildingType]?: ProsumptionEntries<ResourceType>;
};

export type RequirementLookup<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> = {
  [Type in BuildingType]?: BuildingRequirement<ResourceType, BuildingType>;
};

export interface BuildingJSON<Type extends BuildingIdentifier> {
  type: Type;
  level: number;
  speed: number;
};

export class Building<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  static BUILD_TIME_DIVISOR = 2500 / 60;

  constructor(
    readonly type: BuildingType,
    // TODO! For now we have the full lookup here, might be nicer to encapsulate in a different way?
    readonly requirements: RequirementLookup<ResourceType, BuildingType>,
    readonly prosumption: ProsumptionLookup<ResourceType, BuildingType>,
    readonly level = 0,
    readonly speed = 100,
  ) {
    const defaultSpeed = speed >= 100 ? 100 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(level?: number, speed?: number): Building<ResourceType, BuildingType> {
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

  get upgraded(): Building<ResourceType, BuildingType> {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded(): Building<ResourceType, BuildingType> {
    return this.new(this.level - 1, this.speed);
  }

  at(speed: number): Building<ResourceType, BuildingType> {
    return this.new(this.level, speed);
  }

  get disabled(): Building<ResourceType, BuildingType> {
    return this.at(0);
  }

  prosumes(stock: Stock<ResourceType>): Prosumer<ResourceType> {
    // TODO maybe we really don't need the lookups here, or can this work without the typecasts?
    const prosumption = (this.prosumption[this.type] || {}) as ProsumptionEntries<ResourceType>;
    const processes = Object.keys(prosumption).map((type) => {
      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      const prosumptionFunc = prosumption[type as ResourceType] as LevelToProsumptionFunc; // never undefined
      const rate = prosumptionFunc(this.level);
      const stocked = stock.has(type as ResourceType);
      // limit production for an optionally maximal stock
      // also for energy a zero resource resource can be created implicitly
      // eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
      const max = (stock.max.getByType(type as ResourceType) as Resource<ResourceType>) ?? stocked;
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

  toJSON(): BuildingJSON<BuildingType> {
    const { type, level, speed } = this;
    return { type, level, speed };
  }
}
