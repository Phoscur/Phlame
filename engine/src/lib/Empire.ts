import type { ResourceIdentifier } from './resources';
import type { PhelopmentIdentifier } from './Phelopment';
import { Phlame, PhlameJSON } from './Phlame';
import { Entity, Event, ID } from './Action';

export interface EmpireJSON<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> {
  id: ID;
  entities: PhlameJSON<ResourceType, PhelopmentType>[];
  events: Event[];
}

export class Empire<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> implements Entity
{
  constructor(
    public id: ID,
    public entities: Phlame<ResourceType, PhelopmentType>[],
    public events: Event[] = [],
  ) {}

  toString(): string {
    return `${this.id} [${this.entities.join(', ')}]`;
  }

  toJSON() {
    return {
      id: this.id,
      entities: this.entities.map((e) => e.toJSON()),
      events: this.events,
    };
  }

  get lastTick() {
    return this.entities.reduce((maxTick, p) => {
      return p.lastTick > maxTick ? p.lastTick : maxTick;
    }, 0);
  }

  addEvent(event: Event) {
    this.events.unshift(event);
    return this;
  }
}
