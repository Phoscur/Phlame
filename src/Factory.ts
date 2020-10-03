
import type { ResourceIdentifier } from "./resources";
import { EnergyCalculation, Stock } from "./resources";
import Building from "./Building";

/**
 * Factory has its own resource and energy mangement,
 * could even model a whole planet
 */
export default class Factory<ResourceTypes extends ResourceIdentifier> {
  name = "";

  buildings: Building<ResourceTypes>[] = [];

  resources: EnergyCalculation<ResourceTypes>;

  constructor(name: string, resources: Stock<ResourceTypes>, buildings: Building<ResourceTypes>[] = []) {
    this.name = name;
    this.buildings = buildings;

    const prosumers = buildings.map((building) => {
      return building.prosumes(resources);
    });
    this.resources = EnergyCalculation.newStock<ResourceTypes>(resources, prosumers);
    // console.log("Factory energy prosumption", this.resources.toString());
  }

  toString() {
    return `${this.name} (${this.resources}) [${this.buildings.join(", ")}]`;
  }
}
