import type { TimeUnit, ResourceIdentifier, StockJSON } from './resources';
import type { BuildingIdentifier, BuildingJSON } from './Building';
import { Action, ActionType, ActionTypes, Entity, ID } from './Action';
import { Economy } from './Economy';

export interface PhlameJSON<
  ResourceType extends ResourceIdentifier,
  UnitType extends BuildingIdentifier,
> {
  id: ID;
  tick: TimeUnit;
  stock: StockJSON<ResourceType>;
  buildings: BuildingJSON<UnitType>[];
}
export class Phlame<ResourceType extends ResourceIdentifier, UnitType extends BuildingIdentifier>
  implements Entity
{
  constructor(
    public readonly id: ID,
    private economy: Economy<ResourceType, UnitType>,
    private actions: Action<ActionType>[] = [],
    private tick: TimeUnit = 0,
  ) {}

  /**
   * Access only relevant actions: consequences strictly after lastTick
   * (a consequence at lastTick has already been applied by update)
   */
  get upcoming(): Action<ActionType>[] {
    // TODO drop actions (keep full count on the entity, then - after persistence - paginate long history?)
    return this.actions.filter((a) => a.consequence.at > this.lastTick);
  }

  get lastTick(): TimeUnit {
    return this.tick;
  }

  get productionTable() {
    return this.economy.resources.productionTable;
  }

  add(action: Action<ActionType>) {
    this.actions.unshift(action);
    return this;
  }

  /**
   * Fast forward the economy to the target tick,
   * applying due action consequences in chronological order on the way
   * @param tick target game cycle to update to
   */
  update(tick: TimeUnit) {
    const due = this.upcoming
      .filter((a) => a.consequence.at <= tick)
      .sort((a, b) => a.consequence.at - b.consequence.at);
    for (const action of due) {
      const cycles = action.consequence.at - this.tick;
      if (cycles > 0) {
        this.economy = this.economy.tick(cycles);
        this.tick = action.consequence.at;
      }
      if (action.consequence.type === ActionTypes.UPDATE) {
        // TODO make action polymorphic?
        // TODO validate payload
        // TODO handle invalid buildingID
        const { buildingID, grade } = action.consequence.payload as {
          buildingID: BuildingIdentifier;
          grade: 'up' | 'down';
        };
        if (grade === 'up') {
          this.economy = this.economy.upgrade(buildingID);
        } else {
          this.economy = this.economy.downgrade(buildingID);
        }
      }
    }
    if (tick > this.tick) {
      // fast forward the remainder
      this.economy = this.economy.tick(tick - this.tick);
      this.tick = tick;
    }
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
