
import type { ResourceIdentifier } from "./resources";
import { Stock } from "./resources";
import Building, { BuildingIdentifier } from "./Building";

export default class Empire<BuildingType extends BuildingIdentifier, ResourceTypes extends ResourceIdentifier> {
  name = "";

  buildings: Building<BuildingType, ResourceTypes>[] = [];

  resources: Stock<ResourceTypes>;

  // energy: EnergyCalculation<Types>;

  constructor(name: string, resources: Stock<ResourceTypes>, buildings: Building<BuildingType, ResourceTypes>[] = []) {
    this.name = name;
    this.buildings = buildings;
    this.resources = resources;
  }

  toString() {
    return `${this.name} (${this.resources}) [${this.buildings.join(", ")}]`;
  }
}
