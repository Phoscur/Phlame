import type { TimeUnit, ResourceIdentifier } from './resources';
import type { BuildingIdentifier } from './Building';
import Action, { ActionTypes, Entity, ID } from './Action';
import Economy from './Economy';

export interface Time {
  /**
   * Unix Epoch (Milliseconds since 1970)
   */
  time: number; // TODO? (re)move? do we even want it here - at least we
  /**
   * Game Tick (starting at 0)
   */
  tick: TimeUnit;
}
export type AttributeMap = Record<string | symbol, string | number>;
export default class Phlame<
  ResourceType extends ResourceIdentifier,
  UnitType extends BuildingIdentifier,
  // TODO? Attributes extends AttributeMap,
> implements Entity
{
  constructor(
    public readonly id: ID,
    private economy: Economy<ResourceType, UnitType>,
    private actions: Action<ActionTypes>[] = [],
    private zeit: Time = { time: 0, tick: 0 },
  ) {}

  /**
   * Access only relevant actions
   */
  get recent(): Action<ActionTypes>[] {
    // TODO filter out old actions: action.consequence.at < time.tick
    // TODO drop actions (keep full count on the entity, then - after persistence - paginate long history?)
    return this.actions;
  }

  get lastTick(): TimeUnit {
    return this.zeit.tick;
  }

  get updatedAt(): number {
    return this.zeit.time;
  }

  add(action: Action<ActionTypes>) {
    this.actions.unshift(action);
    return this;
  }

  update(zeit: Time) {
    this.zeit = zeit;
    // TODO update economy
    return this;
  }

  toString(): string {
    // [${this.time}]
    return `${this.id} (${this.economy.resources}) ${this.economy.buildings.join(', ')}`;
  }
}
