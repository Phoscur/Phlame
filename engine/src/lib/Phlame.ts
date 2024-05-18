import type { TimeUnit, ResourceIdentifier, StockJSON } from './resources';
import type { BuildingIdentifier, BuildingJSON } from './Building';
import Action, { ActionTypes, Entity, ID } from './Action';
import { Economy } from './Economy';

export type PhlameJSON<
  ResourceType extends ResourceIdentifier,
  UnitType extends BuildingIdentifier,
> = {
  id: ID;
  tick: TimeUnit;
  stock: StockJSON<ResourceType>;
  buildings: BuildingJSON<UnitType>[];
};
export class Phlame<ResourceType extends ResourceIdentifier, UnitType extends BuildingIdentifier>
  implements Entity
{
  constructor(
    public readonly id: ID,
    private economy: Economy<ResourceType, UnitType>,
    private actions: Action<ActionTypes>[] = [],
    private tick: TimeUnit = 0,
  ) {}

  /**
   * Access only relevant actions
   */
  get recent(): Action<ActionTypes>[] {
    // TODO filter out old actions: action. consequence.at < time.tick
    // TODO drop actions (keep full count on the entity, then - after persistence - paginate long history?)
    return this.actions;
  }

  get lastTick(): TimeUnit {
    return this.tick;
  }

  get productionTable() {
    return this.economy.resources.productionTable;
  }

  add(action: Action<ActionTypes>) {
    this.actions.unshift(action);
    return this;
  }

  update(tick: TimeUnit) {
    const { lastTick } = this;
    this.tick = tick;
    // TODO while checking actions
    this.economy = this.economy.tick(tick - lastTick);
    return this;
  }

  toString(): string {
    return `${this.id} (${this.economy.resources.toString()}) ${this.economy.buildings.join(', ')}`;
  }

  toJSON(): PhlameJSON<ResourceType, UnitType> {
    const { id, economy, tick } = this;
    return {
      id,
      tick,
      ...economy.toJSON(),
    };
  }
}
