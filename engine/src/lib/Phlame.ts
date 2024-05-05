import type { TimeUnit, ResourceIdentifier } from './resources';
import type { BuildingIdentifier } from './Building';
import Action, { ActionTypes, Entity, ID } from './Action';
import Economy from './Economy';

export default class Phlame<Types extends ResourceIdentifier, UnitTypes extends BuildingIdentifier>
  implements Entity
{
  constructor(
    public readonly id: ID,
    private economy: Economy<UnitTypes, Types>,
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
    return `${this.id} (${this.economy.resources}) ${this.economy.buildings.join(', ')}`;
  }
}
