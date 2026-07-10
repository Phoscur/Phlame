import type { ResourceIdentifier, TimeUnit } from './resources';
import type { PhelopmentIdentifier } from './Phelopment';
import { Phlame, PhlameJSON } from './Phlame';
import { Action, ActionType, Entity, ID } from './Action';
import type { ConsequenceJSON, LogEntryJSON } from './EmpireLog';

export interface EmpireJSON<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> {
  id: ID;
  entities: PhlameJSON<ResourceType, PhelopmentType>[];
  log: LogEntryJSON[];
}

/**
 * Empire - the aggregate root owning the command log (ADR 0012/0018):
 * commands enter through enqueue() which appends the trusted log entry and projects
 * an Action into each concerned entity's queue. Total order = (tick, seq).
 */
export class Empire<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> implements Entity {
  constructor(
    public id: ID,
    public entities: Phlame<ResourceType, PhelopmentType>[],
    public readonly log: LogEntryJSON[] = [],
  ) {}

  toString(): string {
    return `${this.id} [${this.entities.join(', ')}]`;
  }

  toJSON(): EmpireJSON<ResourceType, PhelopmentType> {
    return {
      id: this.id,
      entities: this.entities.map((e) => e.toJSON()),
      log: this.log,
    };
  }

  get lastTick() {
    return this.entities.reduce((maxTick, p) => {
      return p.lastTick > maxTick ? p.lastTick : maxTick;
    }, 0);
  }

  get seq(): number {
    return this.log.length ? this.log[this.log.length - 1].seq + 1 : 0;
  }

  entity(id: ID): Phlame<ResourceType, PhelopmentType> {
    const found = this.entities.find((e) => e.id === id);
    if (!found) {
      throw new Error(`Unknown entity: ${id} (have: ${this.entities.map((e) => e.id).join(', ')})`);
    }
    return found;
  }

  /**
   * Append a command to the trusted log and project it into the concerned entities'
   * queues (Phlame.actions is the projection, ADR 0012). The action's consequence.at
   * is the orderedAt tick - one meaning, deterministically replayable.
   * @throws when a concerned queue is full (Phormulae rule)
   */
  enqueue(
    type: ActionType,
    payload: Record<string, unknown>,
    concerns: Phlame<ResourceType, PhelopmentType>[],
    at: TimeUnit = this.lastTick,
  ): LogEntryJSON {
    const entry: LogEntryJSON = {
      seq: this.seq,
      tick: at,
      type,
      concerns: concerns.map((c) => c.id),
      payload,
    };
    this.project(entry);
    this.log.push(entry);
    return entry;
  }

  /** rebuild the Action projection of a log entry into the concerned entities */
  protected project(entry: LogEntryJSON) {
    for (const id of entry.concerns) {
      const entity = this.entity(id);
      const action: Action<ActionType> = {
        type: entry.type,
        concerns: entity,
        consequence: {
          at: entry.tick, // orderedAt
          type: entry.type,
          payload: entry.payload,
        },
      };
      entity.add(action);
    }
  }

  /**
   * Fast forward the whole empire on the shared timeline (ADR 0002/0012) -
   * every entity works its own queue on the way
   */
  update(tick: TimeUnit) {
    for (const entity of this.entities) {
      entity.update(tick);
    }
    return this;
  }

  /**
   * Replay the command log (ADR 0012): advance the empire to each entry's tick in
   * (tick, seq) order, re-project the command, then fast-forward to the target.
   * Deriving from genesis + applying the log MUST equal incremental play (M0 invariant).
   */
  applyLog(entries: LogEntryJSON[], tick: TimeUnit) {
    const ordered = [...entries].sort((a, b) => a.tick - b.tick || a.seq - b.seq);
    for (const entry of ordered) {
      this.update(entry.tick);
      this.project(entry);
      this.log.push(entry);
    }
    return this.update(tick);
  }

  /** all consequence echoes of the empire's entities (the verifiable echo, ADR 0018) */
  get echoes(): ConsequenceJSON[] {
    return this.entities.flatMap((e) => e.echoes);
  }
}
