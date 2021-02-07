import type { TimeUnit, ResourceIdentifier } from "./resources";
import type { BuildingIdentifier } from "./Building";
import Action, { ActionTypes } from "./Action";
import Building from "./Building";
import { Stock } from "./resources";
import Entity, { ID } from "./Entity.interface";

export default class Phlame<Types extends ResourceIdentifier, UnitTypes extends BuildingIdentifier>
  implements Entity {
  constructor(
    public readonly id: ID,
    private resources: Stock<Types>,
    private buildings: Building<UnitTypes, Types>[] = [],
    private actions: Action<ActionTypes>[] = [],
    private parallelLimits: { [type: string]: number } = {},
    private time: TimeUnit = 0, // TODO? add other properties, as a map -> use factoryenv?
  ) {}

  get recent(): Action<ActionTypes>[] {
    return this.actions;
  }

  add(action: Action<ActionTypes>): Phlame<Types, UnitTypes> {
    this.actions.push(action);
    return this;
  }

  toString(): string {
    // [${this.time}]
    return `${this.id} (${this.resources}) ${this.buildings.join(", ")}`;
  }
}
