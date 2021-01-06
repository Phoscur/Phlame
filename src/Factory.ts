import type { ResourceIdentifier } from "./resources";
import { EnergyCalculation, Stock } from "./resources";
import Building, { BuildingIdentifier } from "./Building";
import ProsumerCollection from "./resources/ProsumerCollection";

/**
 * Factory has its own resource and energy mangement,
 * could even model a whole planet
 */
export default class Factory<BuildingType extends BuildingIdentifier, ResourceTypes extends ResourceIdentifier> {

  readonly name: string;

  readonly buildings: Building<BuildingType, ResourceTypes>[] = [];

  readonly resources: EnergyCalculation<ResourceTypes>;

  constructor(name: string, resources: Stock<ResourceTypes>, buildings: Building<BuildingType, ResourceTypes>[] = []) {
    this.name = name;
    this.buildings = buildings;

    this.resources = this.getResourceCalculation(resources, buildings);
  }

  get stock() {
    return this.resources.stock;
  }

  getResourceCalculation(resources: Stock<ResourceTypes>, buildings: Building<BuildingType, ResourceTypes>[]) {
    const prosumers = new ProsumerCollection(buildings.map((building) => {
      return building.prosumes(resources);
    }));
    return EnergyCalculation.newStock<ResourceTypes>(resources, prosumers);
  }

  protected new(resources: Stock<ResourceTypes>, buildings: Building<BuildingType, ResourceTypes>[]) {
    return new Factory(this.name, resources, buildings);
  }

  /**
   * Adjust consumption of exhausted resources
   */
  recalculationStrategy(stock: Stock<ResourceTypes>, buildings: Building<BuildingType, ResourceTypes>[]): Building<BuildingType, ResourceTypes>[] {
    const prosumers = new ProsumerCollection<ResourceTypes>(buildings.map((b) => b.prosumes(stock)));
    const nextTickWithdrawal = prosumers.reduced.getNegativeResourcesFor(1);
    if (!stock.isFetchable(nextTickWithdrawal)) {
      const missing = stock.getUnfetchable(nextTickWithdrawal);
      return buildings.map((building) => {
        const halt = missing.asArray.some((resource) => building.prosumes(stock).consumes(resource));
        if (halt) {
          // halt building production if its prosumption includes consumption which can't be fulfilled
          return building.disabled;
        }
        return building;
      });
    }
    return buildings.map((building) => {
      // const prosumer = building.prosumes(resources);
      // if (prosumer.consumes())
      // console.log("disabling building", building.toString(), prosumer.toString());
      return building.disabled;
    });
  }

  upgrade(buildingType: BuildingIdentifier) {
    return this.new(this.resources.stock, this.buildings.map((building: Building<BuildingType, ResourceTypes>) => {
      if (building.type === buildingType) {
        return building.upgraded;
      }
      return building;
    }));
  }

  downgrade(buildingType: BuildingIdentifier) {
    return this.new(this.resources.stock, this.buildings.map((building: Building<BuildingType, ResourceTypes>) => {
      if (building.type === buildingType) {
        return building.downgraded;
      }
      return building;
    }));
  }

  tick(cycles = 1) {
    let { resources, buildings } = this;
    while (resources.validFor < cycles) {
      const advanceCycles = resources.validFor;
      cycles -= advanceCycles;
      resources = resources.calculate(advanceCycles);
      buildings = this.recalculationStrategy(resources.stock, buildings);
      resources = this.getResourceCalculation(resources.stock, buildings);
      if (!resources.validFor) {
        throw new Error("Invalid resource (re)calculation");
      }
    }

    resources = resources.calculate(cycles);
    return this.new(resources.stock, buildings);
  }

  toString() {
    return `${this.name} (${this.resources}) [${this.buildings.join(", ")}]`;
  }
}
