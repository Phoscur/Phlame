import {
  EnergyCalculation,
  Prosumer,
  Resource,
  ResourceCollection,
  ResourceProcess,
  ResourceProcessCollection,
  Stock,
  type ResourceIdentifier,
} from './resources';
import { Building, type BuildingIdentifier, type BuildingJSON } from './Building';
import { Phormulae } from './Phormulae';
import { ProsumerCollection } from './resources/ProsumerCollection';
import type { StockJSON } from './resources/Stock';
import type { TimeUnit } from './resources/ResourceProcess';

export interface EconomyJSON<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  buildings: BuildingJSON<BuildingType>[];
  stock: StockJSON<ResourceType>;
  name: string;
};

/**
 * Economy is the sum of production and consumption of resources and energy
 * for a set of building prosumers
 * It interprets the Phormulae (ADR 0015): buildings are pure state, the economy
 * computes their prosumption, costs and build times from the rules.
 */
export class Economy<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  readonly resources: EnergyCalculation<ResourceType>;

  constructor(
    // TODO add/replace: readonly seed - binary or ID like/derived string
    readonly name: string, // TODO? remove unused - or use this as a type? - rather leave it to an actual entity
    resources: Stock<ResourceType>,
    readonly buildings: Building<ResourceType, BuildingType>[] = [],
    // defaulting to the current Phormulae is the documented bridge until injection lands (ADR 0014)
    readonly phormulae: Phormulae = Phormulae.current,
  ) {
    this.resources = this.getResourceCalculation(resources, buildings);
  }

  get stock(): Stock<ResourceType> {
    return this.resources.stock;
  }

  /**
   * Interpret the prosumption Phormulae of a building at its level and speed
   */
  prosumes(
    building: Building<ResourceType, BuildingType>,
    stock: Stock<ResourceType> = this.stock,
  ): Prosumer<ResourceType> {
    const prosumption = this.phormulae.prosumptionFor(building.type);
    const processes = Object.keys(prosumption).map((type) => {
      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      const phormula = prosumption[type as ResourceType]!; // keys are never undefined
      const rate = phormula.at(building.level);
      const stocked = stock.has(type as ResourceType);
      // limit production for an optionally maximal stock
      // also for energy a zero resource resource can be created implicitly
      // eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
      const max = (stock.max.getByType(type as ResourceType) as Resource<ResourceType>) ?? stocked;
      return new ResourceProcess<ResourceType>(rate > 0 ? max : stocked, rate);
    });

    return new Prosumer<ResourceType>(
      building.type,
      ResourceProcessCollection.fromArray<ResourceType>(processes),
      building.speed,
    );
  }

  upgradeCost(building: Building<ResourceType, BuildingType>): ResourceCollection<ResourceType> {
    return this.phormulae
      .requirementFor(building.type)
      .getUpgradeCost(building.level + 1) as ResourceCollection<ResourceType>;
  }

  downgradeCost(building: Building<ResourceType, BuildingType>): ResourceCollection<ResourceType> {
    return this.phormulae
      .requirementFor(building.type)
      .getDowngradeCost(building.level + 1, this.phormulae.downgradeCostDivisor) as ResourceCollection<ResourceType>;
  }

  upgradeTime(building: Building<ResourceType, BuildingType>): TimeUnit {
    return this.buildTime(this.upgradeCost(building));
  }

  downgradeTime(building: Building<ResourceType, BuildingType>): TimeUnit {
    return this.buildTime(this.downgradeCost(building));
  }

  protected buildTime(costs: ResourceCollection<ResourceType>): TimeUnit {
    return Math.floor(
      costs.map((resource) => resource.amount).reduce((sum, amount) => sum + amount, 0) /
        this.phormulae.buildTimeDivisor,
    );
  }

  getResourceCalculation(
    resources: Stock<ResourceType>,
    buildings: Building<ResourceType, BuildingType>[],
  ): EnergyCalculation<ResourceType> {
    const prosumers = new ProsumerCollection(
      buildings.map((building) => {
        return this.prosumes(building, resources);
      }),
    );
    return EnergyCalculation.newStock<ResourceType>(resources, prosumers);
  }

  protected new(
    resources: Stock<ResourceType>,
    buildings: Building<ResourceType, BuildingType>[],
  ): Economy<ResourceType, BuildingType> {
    return new Economy(this.name, resources, buildings, this.phormulae);
  }

  /**
   * Adjust consumption of exhausted resources:
   * Halt buildings
   */
  recalculationStrategy(
    stock: Stock<ResourceType>,
    factor: number,
    buildings: Building<ResourceType, BuildingType>[],
  ): Building<ResourceType, BuildingType>[] {
    const prosumers = new ProsumerCollection<ResourceType>(
      buildings.map((b) => this.prosumes(b, stock)),
    );
    const prosumption = factor < 1 ? prosumers.rebalancedResources(factor) : prosumers.reduced;
    const nextTickWithdrawal = prosumption.getNegativeResourcesFor(1);
    // if (stock.isFetchable(nextTickWithdrawal)) {
    //   return buildings; // TODO how to cover this with a test?
    // }
    const missing = stock.getUnfetchable(nextTickWithdrawal);
    return buildings.map((building) => {
      const halt = missing.asArray.some((resource) =>
        this.prosumes(building, stock).consumes(resource),
      );
      if (halt) {
        // console.warn(`Halting ${building}`);
        // halt building production if its prosumption includes consumption which can't be fulfilled
        return building.disabled;
      }
      return building;
    });
  }

  upgrade(buildingType: BuildingIdentifier): Economy<ResourceType, BuildingType> {
    return this.new(
      this.resources.stock,
      this.buildings.map((building: Building<ResourceType, BuildingType>) => {
        if (building.type === buildingType) {
          return building.upgraded;
        }
        return building;
      }),
    );
  }

  downgrade(buildingType: BuildingIdentifier): Economy<ResourceType, BuildingType> {
    return this.new(
      this.resources.stock,
      this.buildings.map((building: Building<ResourceType, BuildingType>) => {
        if (building.type === buildingType) {
          return building.downgraded;
        }
        return building;
      }),
    );
  }

  tick(cycles = 1): Economy<ResourceType, BuildingType> {
    let { resources, buildings } = this;
    while (resources.validFor < cycles) {
      const advanceCycles = resources.validFor;
      cycles -= advanceCycles;
      resources = resources.calculate(advanceCycles);
      buildings = this.recalculationStrategy(resources.stock, resources.balanceFactor, buildings);
      resources = this.getResourceCalculation(resources.stock, buildings);
      if (!resources.validFor) {
        throw new Error('Invalid resource (re)calculation');
      }
    }

    resources = resources.calculate(cycles);
    return this.new(resources.stock, buildings);
  }

  toString(): string {
    return `${this.name} (${this.resources.toString()}) [${this.buildings.join(', ')}]`;
  }

  toJSON(): EconomyJSON<ResourceType, BuildingType> {
    return {
      name: this.name,
      stock: this.resources.stock.toJSON(),
      buildings: this.buildings.map((b) => b.toJSON()),
    };
  }
}
