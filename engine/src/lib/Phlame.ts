import { type TimeUnit, type ResourceIdentifier, type StockJSON } from './resources';
import type { PhelopmentIdentifier, PhelopmentJSON } from './Phelopment';
import { Action, ActionType, Entity, EventTypes, ID } from './Action';
import type { ConsequenceJSON } from './EmpireLog';
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
  consequences: ConsequenceJSON[];
}

/** the command id every queue action carries in its payload (generated at the app boundary) */
function actionID(action: Action<ActionType>): string {
  return String(action.consequence.payload['id']);
}

export class Phlame<
  ResourceType extends ResourceIdentifier,
  UnitType extends PhelopmentIdentifier,
> implements Entity {
  constructor(
    public readonly id: ID,
    private economy: Economy<ResourceType, UnitType>,
    private actions: Action<ActionType>[] = [],
    private tick: TimeUnit = 0,
    private consequences: ConsequenceJSON[] = [],
  ) {}

  /**
   * The open build queue: commands without a terminal consequence echo (ADR 0018).
   * Actions are stored chronologically (append), so this IS the FIFO queue.
   */
  get upcoming(): Action<ActionType>[] {
    // TODO drop actions (keep full count on the entity, then - after persistence - paginate long history?)
    return this.actions.filter((a) => !this.echoOf(actionID(a), 'completed'));
  }

  /** the consequence echo log - derived facts, never edits of the commands (ADR 0018) */
  get echoes(): ConsequenceJSON[] {
    return this.consequences;
  }

  protected echoOf(actionId: string, event: 'started' | 'completed'): ConsequenceJSON | undefined {
    return this.consequences.find((c) => c.id === `${actionId}:${event}`);
  }

  /**
   * Append a consequence echo - deterministic derived id, idempotent (replay-safe)
   */
  protected echo(
    action: Action<ActionType>,
    event: 'started' | 'completed' | 'voided',
    at: TimeUnit,
  ) {
    const id = `${actionID(action)}:${event === 'voided' ? 'completed' : event}`;
    if (this.consequences.some((c) => c.id === id)) {
      return;
    }
    const { phelopmentID, grade } = action.consequence.payload;
    this.consequences.push({
      id,
      at,
      type: EventTypes.CONSEQUENCE,
      concerns: [this.id],
      payload: { action: actionID(action), event, phelopmentID, grade },
    });
  }

  get lastTick(): TimeUnit {
    return this.tick;
  }

  get productionTable() {
    return this.economy.resources.productionTable;
  }

  /** build queue capacity, ruled by the Phormulae (interpreted by the economy) */
  get queueSlots(): number {
    return this.economy.queueSlots;
  }

  /**
   * @throws when the build queue is full - the queue capacity is a rule (Phormulae)
   */
  add(action: Action<ActionType>) {
    const slots = this.queueSlots;
    if (this.upcoming.length >= slots) {
      throw new Error(`Queue is full (${this.upcoming.length}/${slots})`);
    }
    this.actions.push(action);
    return this;
  }

  /**
   * Remove a queued command that has not started building yet
   * @throws once the build started - costs are fetched, cancelling needs a refund (M2)
   */
  cancel(actionId: string) {
    const started = this.echoOf(actionId, 'started');
    if (started && !this.echoOf(actionId, 'completed')) {
      throw new Error(`Cannot cancel [${actionId}]: already building (refunds are M2 work)`);
    }
    this.actions = this.actions.filter((a) => actionID(a) !== actionId);
    return this;
  }

  /**
   * Fast forward the economy to the target tick, working the FIFO build queue
   * (Wartefunktion): wait until affordable, fetch the cost, build, apply the grade.
   * State transitions are appended as consequence echoes - the commands themselves
   * are never touched (ADR 0018).
   * @param tick target game cycle to update to
   */
  update(tick: TimeUnit) {
    while (this.tick < tick) {
      const [active] = this.upcoming;
      if (!active) {
        break;
      }
      const payload = active.consequence.payload;
      const phelopmentID = payload['phelopmentID'] as UnitType;
      const grade = payload['grade'] as 'up' | 'down';
      const activePhelopment = this.economy.phelopments.find((p) => p.type === phelopmentID);
      if (!activePhelopment) {
        // unknown target: void the command (echoed, so the queue moves on)
        this.echo(active, 'voided', this.tick);
        continue;
      }

      const cost =
        grade === 'up'
          ? this.economy.upgradeCost(activePhelopment)
          : this.economy.downgradeCost(activePhelopment);
      const duration =
        grade === 'up'
          ? this.economy.upgradeTime(activePhelopment)
          : this.economy.downgradeTime(activePhelopment);

      const started = this.echoOf(actionID(active), 'started');
      if (started) {
        const completionTick = started.at + duration;
        if (completionTick > tick) {
          break; // still building past the target
        }
        const cycles = completionTick - this.tick;
        if (cycles > 0) {
          this.economy = this.economy.tick(cycles);
          this.tick = completionTick;
        }
        this.economy =
          grade === 'up'
            ? this.economy.upgrade(phelopmentID)
            : this.economy.downgrade(phelopmentID);
        this.echo(active, 'completed', completionTick);
        continue;
      }

      if (this.economy.resources.stock.isFetchable(cost)) {
        this.economy = this.economy.fetch(cost);
        this.echo(active, 'started', this.tick);
        continue;
      }

      // Wartefunktion: wait for production to afford the cost
      const waitTicks = this.economy.ticksUntilAffordable(cost);
      const startTick = this.tick + waitTicks;
      if (waitTicks === Infinity || startTick > tick) {
        break; // keeps waiting (upcoming is echo-based, the command cannot expire)
      }
      this.economy = this.economy.tick(waitTicks);
      this.tick = startTick;
      // affordability is re-checked next iteration (production may be throttled)
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
    const { id, economy, tick, actions, consequences } = this;
    return {
      id,
      tick,
      ...economy.toJSON(),
      actions: actions.map((a) => ({ ...a, concerns: a.concerns.id })),
      // open consequences are state while saves are snapshot-based (ADR 0018)
      consequences,
    };
  }
}
