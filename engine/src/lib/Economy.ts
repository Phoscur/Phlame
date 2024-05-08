import { EnergyCalculation, Stock, type ResourceIdentifier } from './resources';
import { Building, type BuildingIdentifier, type BuildingJSON } from './Building';
import { ProsumerCollection } from './resources/ProsumerCollection';
import type { StockJSON } from './resources/Stock';

export type EconomyJSON<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> = {
  buildings: BuildingJSON<BuildingType>[];
  stock: StockJSON<ResourceType>;
  name: string;
};

/**
 * Economy is the sum of production and consumption of resources and energy
 * for a set of building prosumers
 */
export class Economy<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  readonly resources: EnergyCalculation<ResourceType>;

  constructor(
    readonly name: string, // TODO? remove unused - or use this as a type? - rather leave it to an actual entity
    resources: Stock<ResourceType>,
    readonly buildings: Building<ResourceType, BuildingType>[] = [],
  ) {
    this.resources = this.getResourceCalculation(resources, buildings);
  }

  get stock(): Stock<ResourceType> {
    return this.resources.stock;
  }

  getResourceCalculation(
    resources: Stock<ResourceType>,
    buildings: Building<ResourceType, BuildingType>[],
  ): EnergyCalculation<ResourceType> {
    const prosumers = new ProsumerCollection(
      buildings.map((building) => {
        return building.prosumes(resources);
      }),
    );
    return EnergyCalculation.newStock<ResourceType>(resources, prosumers);
  }

  protected new(
    resources: Stock<ResourceType>,
    buildings: Building<ResourceType, BuildingType>[],
  ): Economy<ResourceType, BuildingType> {
    return new Economy(this.name, resources, buildings);
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
    const prosumers = new ProsumerCollection<ResourceType>(buildings.map((b) => b.prosumes(stock)));
    const prosumption = factor < 1 ? prosumers.rebalancedResources(factor) : prosumers.reduced;
    const nextTickWithdrawal = prosumption.getNegativeResourcesFor(1);
    // if (stock.isFetchable(nextTickWithdrawal)) {
    //   return buildings; // TODO how to cover this with a test?
    // }
    const missing = stock.getUnfetchable(nextTickWithdrawal);
    return buildings.map((building) => {
      const halt = missing.asArray.some((resource) => building.prosumes(stock).consumes(resource));
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
    return `${this.name} (${this.resources}) [${this.buildings.join(', ')}]`;
  }

  toJSON(): EconomyJSON<ResourceType, BuildingType> {
    return {
      name: this.name,
      stock: this.resources.stock.toJSON(),
      buildings: this.buildings.map((b) => b.toJSON()),
    };
  }
}
