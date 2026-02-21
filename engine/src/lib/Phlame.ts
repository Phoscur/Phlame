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
   * Access only relevant actions
   */
  get upcoming(): Action<ActionType>[] {
    // TODO drop actions (keep full count on the entity, then - after persistence - paginate long history?)
    return this.actions.filter((a) => a.consequence.at >= this.lastTick);
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
   * @param tick target game cycle to update to
   */
  update(tick: TimeUnit) {
    const { lastTick, upcoming: actions } = this;
    if (!actions.filter((a) => a.consequence.at <= tick).length) {
      // fast forward
      this.tick = tick;
      this.economy = this.economy.tick(tick - lastTick);
      console.log('Fast forwarded to', tick);
      return this;
    }
    let action = actions.pop();
    while (action) {
      console.log('Processing action', action.type, 'consequencial at', action.consequence.at);
      if (action.consequence.at > tick) {
        // consequence is in the future - skip
        console.log('Action is in the future, skipping', action.type, action.consequence.at);
        action = actions.pop();
        continue;
      }
      if (action.consequence.at < lastTick) {
        // action is in the past, should not be in recents?! - skip
        console.log('Action is in the past, skipping', action.type, action.consequence.at);
        action = actions.pop();
        continue;
      }
      const cycles = action.consequence.at - lastTick;
      tick -= cycles;
      this.tick += cycles;
      this.economy = this.economy.tick(cycles);
      if (action.consequence.type === ActionTypes.UPDATE) {
        // TODO make action polymorphic?
        // TODO validate payload
        // TODO handle invalid buildingID
        const { buildingID, grade } = action.consequence.payload as {
          buildingID: BuildingIdentifier;
          grade: 'up' | 'down';
        };
        console.log('Applying action', action.consequence);
        if (grade === 'up') {
          this.economy = this.economy.upgrade(buildingID);
        } else {
          this.economy = this.economy.downgrade(buildingID);
        }
      }
      action = actions.pop();
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
