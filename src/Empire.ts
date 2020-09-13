
import type { ResourceIdentifier } from "./resources";
import { Stock } from "./resources";
import Building from "./Building";

export default class Empire<Types extends ResourceIdentifier> {
  name = "";

  buildings: Building[] = [];

  resources: Stock<Types>;

  // energy: EnergyCalculation<Types>;

  constructor(name: string, resources: Stock<Types>, buildings: Building[] = []) {
    this.name = name;
    this.buildings = buildings;
    this.resources = resources;
    /* TODO factory to create resource processes from buildings
    const prosumers = buildings.map((building) => {
      return building.consumes();
    });
    const producers = buildings.map((building) => {
      return building.produces();
    });
    */
  }

  toString() {
    return `${this.name} (${this.resources}) [${this.buildings.join(", ")}]`;
  }
}
