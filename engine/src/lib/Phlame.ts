import { type TimeUnit, type ResourceIdentifier, type StockJSON } from './resources';
import type { PhelopmentIdentifier, PhelopmentJSON } from './Phelopment';
import { Action, ActionType, Entity, ID } from './Action';
import { Economy } from './Economy';

export interface PhlameJSON<
  ResourceType extends ResourceIdentifier,
  UnitType extends PhelopmentIdentifier,
> {
  id: ID;
  tick: TimeUnit;
  stock: StockJSON<ResourceType>;
  phelopments: PhelopmentJSON<UnitType>[];
  actions: (Omit<Action<ActionType>, 'concerns'> & { concerns: ID })[];
}
export class Phlame<ResourceType extends ResourceIdentifier, UnitType extends PhelopmentIdentifier>
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
   * (a consequence at lastTick has already been applied by update).
   * Actions are stored chronologically (append), so this IS the FIFO queue.
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
    this.actions.push(action);
    return this;
  }

  cancel(actionId: string) {
    this.actions = this.actions.filter(a => a.consequence.payload['id'] !== actionId);
    return this;
  }

  /**
   * Fast forward the economy to the target tick,
   * applying due action consequences in chronological order on the way
   * @param tick target game cycle to update to
   */
  update(tick: TimeUnit) {
    while (this.tick < tick) {
      const list = this.upcoming;
      if (list.length === 0) {
        break;
      }
      const active = list[0];
      const payload = active.consequence.payload;
      const activePhelopment = this.economy.phelopments.find(p => p.type === payload['phelopmentID']);
      
      if (!activePhelopment) {
        active.consequence.at = this.tick;
        continue;
      }

      const cost = payload['grade'] === 'up'
        ? this.economy.upgradeCost(activePhelopment)
        : this.economy.downgradeCost(activePhelopment);

      const duration = payload['grade'] === 'up'
        ? this.economy.upgradeTime(activePhelopment)
        : this.economy.downgradeTime(activePhelopment);

      if (typeof payload['startedAt'] === 'number') {
        const completionTick = payload['startedAt'] + duration;
        if (completionTick <= tick) {
          const cycles = completionTick - this.tick;
          if (cycles > 0) {
            this.economy = this.economy.tick(cycles);
            this.tick = completionTick;
          }
          if (payload['grade'] === 'up') {
            this.economy = this.economy.upgrade(payload['phelopmentID'] as PhelopmentIdentifier);
          } else {
            this.economy = this.economy.downgrade(payload['phelopmentID'] as PhelopmentIdentifier);
          }
          active.consequence.at = completionTick;
        } else {
          const cycles = tick - this.tick;
          if (cycles > 0) {
            this.economy = this.economy.tick(cycles);
            this.tick = tick;
          }
          break;
        }
      } else {
        if (this.economy.resources.stock.isFetchable(cost)) {
          this.economy = this.economy.fetch(cost);
          payload['startedAt'] = this.tick;
          active.consequence.at = this.tick + duration;
        } else {
          const waitTicks = this.economy.ticksUntilAffordable(cost);
          if (waitTicks === Infinity) {
            // nothing produces the missing resource - keep the action queued past the
            // target tick (`upcoming` filters at > lastTick), it re-checks next update
            active.consequence.at = tick + 1;
            const cycles = tick - this.tick;
            if (cycles > 0) {
              this.economy = this.economy.tick(cycles);
              this.tick = tick;
            }
            break;
          }
          const startTick = this.tick + waitTicks;
          // lift the estimate so the waiting action neither expires out of the
          // `upcoming` filter while time passes it by, nor lies about its finish
          active.consequence.at = startTick + duration;
          if (startTick <= tick) {
            this.economy = this.economy.tick(waitTicks);
            this.tick = startTick;
          } else {
            const cycles = tick - this.tick;
            if (cycles > 0) {
              this.economy = this.economy.tick(cycles);
              this.tick = tick;
            }
            break;
          }
        }
      }
    }

    if (tick > this.tick) {
      this.economy = this.economy.tick(tick - this.tick);
      this.tick = tick;
    }
    return this;
  }

  toString(): string {
    return `${this.id} (${this.economy.resources.toString()}) ${this.economy.phelopments.join(', ')}`;
  }

  toJSON(): PhlameJSON<ResourceType, UnitType> {
    const { id, economy, tick, actions } = this;
    return {
      id,
      tick,
      ...economy.toJSON(),
      actions: actions.map(a => ({ ...a, concerns: a.concerns.id })),
    };
  }
}
