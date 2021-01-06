
import type { ResourceIdentifier } from "./resources";
import { Stock } from "./resources";

export default class FactoryEnvironment<Types extends ResourceIdentifier> {
  name = "";
  resources: Stock<Types>;
  // TODO add other properties, as a map?

  constructor(name: string, resources: Stock<Types>) {
    this.name = name;
    this.resources = resources;
  }

  toString() {
    return `${this.name} (${this.resources})`;
  }
}
