import type { ResourceIdentifier } from './resources';
import { EnergyCalculation, Stock } from './resources';
import Building, { BuildingIdentifier } from './Building';
import ProsumerCollection from './resources/ProsumerCollection';

/**
 * Economy is the sum of production and consumption of resources and energy
 * for a set of building prosumers
 */
export default class Economy<
  BuildingType extends BuildingIdentifier,
  ResourceTypes extends ResourceIdentifier,
> {
  readonly name: string;

  readonly buildings: Building<BuildingType, ResourceTypes>[] = [];

  readonly resources: EnergyCalculation<ResourceTypes>;

  constructor(
    name: string,
    resources: Stock<ResourceTypes>,
    buildings: Building<BuildingType, ResourceTypes>[] = [],
  ) {
    this.name = name;
    this.buildings = buildings;

    this.resources = this.getResourceCalculation(resources, buildings);
  }

  get stock(): Stock<ResourceTypes> {
    return this.resources.stock;
  }

  getResourceCalculation(
    resources: Stock<ResourceTypes>,
    buildings: Building<BuildingType, ResourceTypes>[],
  ): EnergyCalculation<ResourceTypes> {
    const prosumers = new ProsumerCollection(
      buildings.map((building) => {
        return building.prosumes(resources);
      }),
    );
    return EnergyCalculation.newStock<ResourceTypes>(resources, prosumers);
  }

  protected new(
    resources: Stock<ResourceTypes>,
    buildings: Building<BuildingType, ResourceTypes>[],
  ): Economy<BuildingType, ResourceTypes> {
    return new Economy(this.name, resources, buildings);
  }

  /**
   * Adjust consumption of exhausted resources:
   * Halt buildings
   */
  recalculationStrategy(
    stock: Stock<ResourceTypes>,
    factor: number,
    buildings: Building<BuildingType, ResourceTypes>[],
  ): Building<BuildingType, ResourceTypes>[] {
    const prosumers = new ProsumerCollection<ResourceTypes>(
      buildings.map((b) => b.prosumes(stock)),
    );
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

  upgrade(buildingType: BuildingIdentifier): Economy<BuildingType, ResourceTypes> {
    return this.new(
      this.resources.stock,
      this.buildings.map((building: Building<BuildingType, ResourceTypes>) => {
        if (building.type === buildingType) {
          return building.upgraded;
        }
        return building;
      }),
    );
  }

  downgrade(buildingType: BuildingIdentifier): Economy<BuildingType, ResourceTypes> {
    return this.new(
      this.resources.stock,
      this.buildings.map((building: Building<BuildingType, ResourceTypes>) => {
        if (building.type === buildingType) {
          return building.downgraded;
        }
        return building;
      }),
    );
  }

  tick(cycles = 1): Economy<BuildingType, ResourceTypes> {
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
}
