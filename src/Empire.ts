import { ResourceIdentifier } from "./resources/Resource";
import Building from "./Building";
import Stock from "./resources/Stock";

export default class Empire<Types extends ResourceIdentifier> {
  name = "";

  buildings: Building[] = [];

  resources: Stock<Types>;

  constructor(name: string, resources: Stock<Types>, buildings: Building[] = []) {
    this.name = name;
    this.buildings = buildings;
    this.resources = resources;
  }

  toString() {
    return `${this.name} (${this.resources}) [${this.buildings.join(", ")}]`;
  }
}
