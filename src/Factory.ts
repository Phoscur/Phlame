
import type { ResourceIdentifier } from "./resources";
import { EnergyCalculation, Stock } from "./resources";
import Building from "./Building";

/**
 * Factory has its own resource and energy mangement,
 * could even model a whole planet
 */
export default class Factory<ResourceTypes extends ResourceIdentifier> {
  name = "";

  buildings: Building[] = [];

  resources: EnergyCalculation<ResourceTypes>;

  constructor(name: string, resources: Stock<ResourceTypes>, buildings: Building[] = []) {
    this.name = name;
    this.buildings = buildings;
    /* TODO factory to create resource processes from buildings
    const prosumers = buildings.map((building) => {
      return building.prosumes();
    }); */
    this.resources = EnergyCalculation.newStock<ResourceTypes>(resources, []);
    // console.log("Factory energy prosumption", this.resources.toString());
  }

  toString() {
    return `${this.name} (${this.resources}) [${this.buildings.join(", ")}]`;
  }
}
